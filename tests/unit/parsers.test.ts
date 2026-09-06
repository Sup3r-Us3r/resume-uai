import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { TextParser } from "../../src/infrastructure/parsers/text-parser.js";
import { MarkdownParser } from "../../src/infrastructure/parsers/markdown-parser.js";
import { FileParserFactory } from "../../src/infrastructure/parsers/file-parser-factory.js";
import {
  EmptyFileError,
  FileNotFoundError,
  UnsupportedFormatError
} from "../../src/shared/errors/app-error.js";

describe("File Parsers", () => {
  let tempDir: string;
  let txtFile: string;
  let mdFile: string;
  let emptyFile: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-test-"));
    txtFile = path.join(tempDir, "sample.txt");
    mdFile = path.join(tempDir, "sample.md");
    emptyFile = path.join(tempDir, "empty.txt");

    await fs.writeFile(txtFile, "Alex Morgan\nSoftware Engineer\nExperience at Acme");
    await fs.writeFile(mdFile, "# Alex Morgan\n**Senior Engineer**\n- Built APIs");
    await fs.writeFile(emptyFile, "   \n  \t  \n");
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("TextParser", () => {
    const parser = new TextParser();

    it("should recognize .txt extension", () => {
      expect(parser.supports(".txt")).toBe(true);
      expect(parser.supports(".md")).toBe(false);
    });

    it("should extract content from a text file", async () => {
      const text = await parser.parse(txtFile);
      expect(text).toContain("Alex Morgan");
      expect(text).toContain("Experience at Acme");
    });

    it("should throw FileNotFoundError for non-existent files", async () => {
      await expect(parser.parse(path.join(tempDir, "non-existent.txt"))).rejects.toThrow(
        FileNotFoundError
      );
    });

    it("should throw EmptyFileError for whitespace-only files", async () => {
      await expect(parser.parse(emptyFile)).rejects.toThrow(EmptyFileError);
    });
  });

  describe("MarkdownParser", () => {
    const parser = new MarkdownParser();

    it("should recognize .md and .markdown extensions", () => {
      expect(parser.supports(".md")).toBe(true);
      expect(parser.supports(".markdown")).toBe(true);
      expect(parser.supports(".pdf")).toBe(false);
    });

    it("should extract content from a markdown file", async () => {
      const text = await parser.parse(mdFile);
      expect(text).toContain("# Alex Morgan");
      expect(text).toContain("- Built APIs");
    });
  });

  describe("FileParserFactory", () => {
    it("should resolve TextParser for .txt", () => {
      const parser = FileParserFactory.getParser("resume.txt");
      expect(parser).toBeInstanceOf(TextParser);
    });

    it("should resolve MarkdownParser for .md", () => {
      const parser = FileParserFactory.getParser("resume.md");
      expect(parser).toBeInstanceOf(MarkdownParser);
    });

    it("should throw UnsupportedFormatError for unknown extensions", () => {
      expect(() => FileParserFactory.getParser("resume.docx")).toThrow(UnsupportedFormatError);
      expect(() => FileParserFactory.getParser("resume.png")).toThrow(UnsupportedFormatError);
    });
  });
});
