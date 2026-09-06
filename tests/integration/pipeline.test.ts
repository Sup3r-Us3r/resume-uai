import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { GenerateResume } from "../../src/application/use-cases/generate-resume.js";
import { MockAIProvider } from "../../src/infrastructure/ai/mock-ai-provider.js";

describe("Resume Generation Pipeline (End-to-End Integration)", () => {
  let tempOutputDir: string;
  const sampleInputPath = path.resolve(process.cwd(), "examples", "senior-software-engineer.md");

  beforeAll(async () => {
    tempOutputDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-pipeline-test-"));
  });

  afterAll(async () => {
    await fs.rm(tempOutputDir, { recursive: true, force: true });
  });

  it("should execute full pipeline in English: file extraction -> mock AI -> schema validation -> ATS analysis -> Markdown & PDF generation", async () => {
    const mockProvider = new MockAIProvider();
    const useCase = new GenerateResume(mockProvider);

    const result = await useCase.execute({
      filePath: sampleInputPath,
      outputDir: tempOutputDir,
      fileNamePrefix: "alex-rivera-en",
      lang: "en"
    });

    // 1. Verify Resume Data structure
    expect(result.resume).toBeDefined();
    expect(result.resume.personal.name).toBe("Alex Rivera");
    expect(result.resume.headline).toContain("Senior Software Engineer");
    expect(result.resume.experience.length).toBeGreaterThanOrEqual(1);

    // 2. Verify ATS Analysis Output
    expect(result.atsAnalysis).toBeDefined();
    expect(result.atsAnalysis.score).toBeGreaterThanOrEqual(80);
    expect(result.atsAnalysis.level).toMatch(/Good|Excellent/);
    expect(result.atsAnalysis.metrics.actionVerbsFound).toBeGreaterThan(0);

    // 3. Verify Markdown Output file
    expect(result.markdownPath).toBeDefined();
    const mdContent = await fs.readFile(result.markdownPath, "utf-8");
    expect(mdContent).toContain("# Alex Rivera");
    expect(mdContent).toContain("## PROFESSIONAL SUMMARY");
    expect(mdContent).toContain("## PROFESSIONAL EXPERIENCE");

    // 4. Verify PDF Output file
    expect(result.pdfPath).toBeDefined();
    const pdfStat = await fs.stat(result.pdfPath);
    expect(pdfStat.size).toBeGreaterThan(1000); // PDF is non-empty binary

    const pdfBuffer = await fs.readFile(result.pdfPath);
    const pdfHeader = pdfBuffer.subarray(0, 5).toString("utf-8");
    expect(pdfHeader).toBe("%PDF-"); // Valid PDF magic bytes
  }, 30000);

  it("should execute full pipeline in Portuguese: file extraction -> mock AI -> schema validation -> ATS analysis -> Markdown & PDF generation", async () => {
    const mockProvider = new MockAIProvider();
    const useCase = new GenerateResume(mockProvider);

    const result = await useCase.execute({
      filePath: sampleInputPath,
      outputDir: tempOutputDir,
      fileNamePrefix: "alex-rivera-pt",
      lang: "pt"
    });

    // 1. Verify Resume Data structure
    expect(result.resume).toBeDefined();
    expect(result.resume.personal.name).toBe("Alex Rivera");
    expect(result.resume.headline).toContain("Engenheiro de Software Sênior");
    expect(result.resume.experience.length).toBeGreaterThanOrEqual(1);

    // 2. Verify ATS Analysis Output
    expect(result.atsAnalysis).toBeDefined();
    expect(result.atsAnalysis.score).toBeGreaterThanOrEqual(80);

    // 3. Verify Markdown Output file in Portuguese
    expect(result.markdownPath).toBeDefined();
    const mdContent = await fs.readFile(result.markdownPath, "utf-8");
    expect(mdContent).toContain("# Alex Rivera");
    expect(mdContent).toContain("## RESUMO PROFISSIONAL");
    expect(mdContent).toContain("## EXPERIÊNCIA PROFISSIONAL");

    // 4. Verify PDF Output file
    expect(result.pdfPath).toBeDefined();
    const pdfStat = await fs.stat(result.pdfPath);
    expect(pdfStat.size).toBeGreaterThan(1000);
  }, 30000);
});
