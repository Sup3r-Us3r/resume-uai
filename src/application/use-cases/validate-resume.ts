import { ExtractResumeContent } from "./extract-resume-content.js";
import { ATSAnalyzer, type ATSAnalysisResult } from "../../domain/services/ats-analyzer.js";

export class ValidateResume {
  constructor(
    private readonly extractor = new ExtractResumeContent(),
    private readonly analyzer = new ATSAnalyzer()
  ) {}

  async execute(filePath: string): Promise<{
    filePath: string;
    analysis: ATSAnalysisResult;
    extractedTextLength: number;
  }> {
    const rawContent = await this.extractor.execute(filePath);
    const analysis = this.analyzer.analyzeRawText(rawContent);

    return {
      filePath,
      analysis,
      extractedTextLength: rawContent.length
    };
  }
}
