import path from "node:path";
import type { AIProvider, SupportedLanguage } from "../ports/ai-provider.js";
import type { Resume } from "../../domain/schemas/resume-schema.js";
import { ATSAnalyzer, type ATSAnalysisResult } from "../../domain/services/ats-analyzer.js";
import { ExtractResumeContent } from "./extract-resume-content.js";
import { MarkdownRenderer } from "../../infrastructure/renderers/markdown-renderer.js";
import { PdfRenderer } from "../../infrastructure/renderers/pdf-renderer.js";
import { FileWriter } from "../../infrastructure/filesystem/file-writer.js";

export interface GenerateResumeInput {
  filePath: string;
  outputDir?: string;
  templatePath?: string;
  jobDescriptionPath?: string;
  fileNamePrefix?: string;
  lang?: SupportedLanguage;
}

export interface GenerateResumeOutput {
  resume: Resume;
  markdownPath: string;
  pdfPath: string;
  atsAnalysis: ATSAnalysisResult;
}

export class GenerateResume {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly extractor = new ExtractResumeContent(),
    private readonly atsAnalyzer = new ATSAnalyzer(),
    private readonly markdownRenderer = new MarkdownRenderer(),
    private readonly pdfRenderer = new PdfRenderer()
  ) {}

  async execute(input: GenerateResumeInput): Promise<GenerateResumeOutput> {
    const lang = input.lang || "pt";

    // 1. Extract raw content from primary resume input file
    const rawContent = await this.extractor.execute(input.filePath);

    // 2. Extract job description content if provided
    let jobDescriptionText: string | undefined;
    if (input.jobDescriptionPath) {
      jobDescriptionText = await this.extractor.execute(input.jobDescriptionPath);
    }

    // 3. AI: Interpret, normalize, improve writing, optimize for ATS
    const resume = await this.aiProvider.generateResume(rawContent, {
      jobDescription: jobDescriptionText,
      lang
    });

    // 4. Deterministic ATS Analysis
    const atsAnalysis = this.atsAnalyzer.analyze(resume);

    // 5. Render Markdown
    const markdownContent = await this.markdownRenderer.render(resume, {
      templatePath: input.templatePath,
      lang
    });

    // 6. Render PDF
    const pdfBuffer = await this.pdfRenderer.render(resume, {
      lang
    });

    // 7. Write outputs to target directory
    const outputDir = input.outputDir || "./output";
    const prefix = input.fileNamePrefix || "resume";

    const targetMarkdownPath = path.join(outputDir, `${prefix}.md`);
    const targetPdfPath = path.join(outputDir, `${prefix}.pdf`);

    const markdownPath = await FileWriter.write(targetMarkdownPath, markdownContent);
    const pdfPath = await FileWriter.write(targetPdfPath, pdfBuffer);

    return {
      resume,
      markdownPath,
      pdfPath,
      atsAnalysis
    };
  }
}
