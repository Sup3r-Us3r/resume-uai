import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import type {
  AIProvider,
  GenerateResumeOptions
} from "../../application/ports/ai-provider.js";
import { ResumeSchema, type Resume } from "../../domain/schemas/resume-schema.js";
import { AIProviderError, SchemaValidationError } from "../../shared/errors/app-error.js";
import {
  RESUME_OPTIMIZATION_SYSTEM_INSTRUCTION,
  buildResumePrompt
} from "./prompts/resume-optimization.js";

export interface GenkitRetryInfo {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  error: Error;
  model: string;
}

export interface GenkitFallbackInfo {
  fromModel: string;
  toModel: string;
  reason: string;
}

export interface GenkitProviderOptions {
  apiKey: string;
  model?: string;
  fallbackModel?: string;
  maxRetries?: number;
  temperature?: number;
  onRetry?: (info: GenkitRetryInfo) => void;
  onFallback?: (info: GenkitFallbackInfo) => void;
}

export class GenkitProvider implements AIProvider {
  private readonly ai: ReturnType<typeof genkit>;
  private readonly primaryModel: string;
  private readonly fallbackModel?: string;
  private readonly maxRetries: number;
  private readonly temperature: number;
  private readonly onRetry?: (info: GenkitRetryInfo) => void;
  private readonly onFallback?: (info: GenkitFallbackInfo) => void;

  constructor(options: GenkitProviderOptions) {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new AIProviderError("Gemini API key is required to initialize GenkitProvider.");
    }

    this.ai = genkit({
      plugins: [googleAI({ apiKey: options.apiKey })]
    });

    this.primaryModel = this.normalizeModelName(options.model || "gemini-3.5-flash-lite");
    this.fallbackModel = options.fallbackModel
      ? this.normalizeModelName(options.fallbackModel)
      : "googleai/gemini-3.5-flash";

    this.maxRetries = options.maxRetries ?? 3;
    this.temperature = options.temperature ?? 0.2;
    this.onRetry = options.onRetry;
    this.onFallback = options.onFallback;
  }

  async generateResume(rawContent: string, options?: GenerateResumeOptions): Promise<Resume> {
    const prompt = buildResumePrompt(rawContent, options);

    // 1. Try with primary model
    try {
      return await this.generateWithModel(this.primaryModel, prompt);
    } catch (primaryErr: unknown) {
      const isTransient = this.isTransientError(primaryErr);
      const canFallback =
        isTransient &&
        this.fallbackModel &&
        this.fallbackModel.toLowerCase() !== this.primaryModel.toLowerCase();

      if (!canFallback) {
        throw primaryErr;
      }

      const reason = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      this.onFallback?.({
        fromModel: this.primaryModel,
        toModel: this.fallbackModel!,
        reason
      });

      // 2. Try with fallback model
      return await this.generateWithModel(this.fallbackModel!, prompt);
    }
  }

  private async generateWithModel(model: string, prompt: string): Promise<Resume> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.ai.generate({
          model,
          prompt,
          system: RESUME_OPTIMIZATION_SYSTEM_INSTRUCTION,
          output: {
            schema: ResumeSchema
          },
          config: {
            temperature: this.temperature
          }
        });

        const rawOutput = response.output;
        if (!rawOutput) {
          // Fallback to parsing response.text if schema output wasn't auto-populated
          const text = response.text?.trim();
          if (!text) {
            throw new AIProviderError(`Genkit returned an empty response from model ${model}.`);
          }
          return this.parseAndValidateResponse(text);
        }

        const validation = ResumeSchema.safeParse(rawOutput);
        if (!validation.success) {
          const issues = validation.error.errors
            .map((e) => `[${e.path.join(".") || "root"}]: ${e.message}`)
            .join("; ");
          throw new SchemaValidationError(`Genkit output failed ResumeSchema validation: ${issues}`, {
            issues: validation.error.errors,
            receivedData: rawOutput
          });
        }

        return validation.data;
      } catch (err: unknown) {
        lastError = err;
        const isTransient = this.isTransientError(err);

        if (!isTransient || attempt >= this.maxRetries) {
          break;
        }

        const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        const jitter = Math.floor(Math.random() * 500);
        const delayMs = baseDelay + jitter;

        const errorObj = err instanceof Error ? err : new Error(String(err));
        this.onRetry?.({
          attempt,
          maxRetries: this.maxRetries,
          delayMs,
          error: errorObj,
          model
        });

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new AIProviderError(`Genkit API request failed for model ${model}: ${message}`, lastError);
  }

  private isTransientError(error: unknown): boolean {
    if (!error) return false;
    const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();

    // 503 UNAVAILABLE / high demand
    if (msg.includes("503") || msg.includes("high demand") || msg.includes("unavailable")) {
      return true;
    }

    // 429 RESOURCE_EXHAUSTED / quota / rate limits
    if (
      msg.includes("429") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota") ||
      msg.includes("rate-limit")
    ) {
      return true;
    }

    // Network disconnects and timeouts
    if (
      msg.includes("fetch failed") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("timeout")
    ) {
      return true;
    }

    return false;
  }

  private parseAndValidateResponse(rawText: string): Resume {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleanJson);
    } catch (parseError) {
      throw new AIProviderError(
        `Failed to parse Genkit response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        { rawOutput: cleanJson }
      );
    }

    const validation = ResumeSchema.safeParse(parsedJson);
    if (!validation.success) {
      const issues = validation.error.errors
        .map((e) => `[${e.path.join(".") || "root"}]: ${e.message}`)
        .join("; ");
      throw new SchemaValidationError(`Genkit text response did not match ResumeSchema: ${issues}`, {
        issues: validation.error.errors,
        receivedData: parsedJson
      });
    }

    return validation.data;
  }

  private normalizeModelName(model: string): string {
    if (!model.startsWith("googleai/")) {
      return `googleai/${model}`;
    }
    return model;
  }
}
