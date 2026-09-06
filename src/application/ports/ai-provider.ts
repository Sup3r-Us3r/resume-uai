import type { Resume } from "../../domain/schemas/resume-schema.js";

export type SupportedLanguage = "pt" | "en";

export interface GenerateResumeOptions {
  jobDescription?: string;
  lang?: SupportedLanguage;
}

export interface AIProvider {
  /**
   * Generates a structured, ATS-optimized Resume from raw text input.
   * @param rawContent The extracted raw resume content.
   * @param options Configuration including optional job description and target language.
   */
  generateResume(rawContent: string, options?: GenerateResumeOptions): Promise<Resume>;
}

