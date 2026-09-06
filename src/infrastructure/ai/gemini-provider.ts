import type {
  AIProvider,
  GenerateResumeOptions
} from "../../application/ports/ai-provider.js";
import type { Resume } from "../../domain/schemas/resume-schema.js";
import { GenkitProvider, type GenkitProviderOptions } from "./genkit-provider.js";

export type GeminiProviderOptions = GenkitProviderOptions;

export class GeminiProvider implements AIProvider {
  private readonly delegate: GenkitProvider;

  constructor(options: GeminiProviderOptions) {
    this.delegate = new GenkitProvider(options);
  }

  async generateResume(
    rawContent: string,
    options?: GenerateResumeOptions
  ): Promise<Resume> {
    return this.delegate.generateResume(rawContent, options);
  }
}

