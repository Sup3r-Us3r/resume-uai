import fs from "node:fs/promises";
import path from "node:path";
import type { FileParser } from "../../application/ports/file-parser.js";
import { EmptyFileError, FileNotFoundError } from "../../shared/errors/app-error.js";

export class MarkdownParser implements FileParser {
  supports(extension: string): boolean {
    const ext = extension.toLowerCase();
    return ext === ".md" || ext === ".markdown";
  }

  async parse(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(filePath);
    try {
      await fs.access(resolvedPath);
    } catch {
      throw new FileNotFoundError(filePath);
    }

    const content = await fs.readFile(resolvedPath, "utf-8");
    const normalized = content.replace(/\r\n/g, "\n").trim();

    if (normalized.length === 0) {
      throw new EmptyFileError(filePath);
    }

    return normalized;
  }
}
