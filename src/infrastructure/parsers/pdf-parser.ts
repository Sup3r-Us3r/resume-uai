import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse";
import type { FileParser } from "../../application/ports/file-parser.js";
import { EmptyFileError, FileNotFoundError, AppError } from "../../shared/errors/app-error.js";

export class PdfParser implements FileParser {
  supports(extension: string): boolean {
    return extension.toLowerCase() === ".pdf";
  }

  async parse(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(filePath);
    try {
      await fs.access(resolvedPath);
    } catch {
      throw new FileNotFoundError(filePath);
    }

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(resolvedPath);
    } catch (err) {
      throw new AppError(`Failed to read PDF file "${filePath}": ${err instanceof Error ? err.message : String(err)}`, "FILE_ERROR");
    }

    let pdfData: { text: string; numpages: number };
    try {
      // pdfParse is default export
      const parseFn = typeof pdfParse === "function" ? pdfParse : (pdfParse as unknown as { default: typeof pdfParse }).default;
      pdfData = await parseFn(buffer);
    } catch (parseErr) {
      throw new AppError(
        `Failed to extract text from PDF "${filePath}". The file might be encrypted, corrupted, or not a valid PDF.`,
        "PARSER_ERROR",
        parseErr
      );
    }

    const cleanText = pdfData.text ? pdfData.text.trim() : "";
    if (cleanText.length === 0) {
      throw new EmptyFileError(
        `${filePath} (The PDF contains no selectable/extractable text. It may consist solely of scanned images).`
      );
    }

    return cleanText;
  }
}
