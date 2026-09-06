import fs from "node:fs/promises";
import path from "node:path";
import type { FileParser } from "../../application/ports/file-parser.js";
import { EmptyFileError, FileNotFoundError } from "../../shared/errors/app-error.js";

export class TextParser implements FileParser {
  supports(extension: string): boolean {
    return extension.toLowerCase() === ".txt";
  }

  async parse(filePath: string): Promise<string> {
    const resolvedPath = path.resolve(filePath);
    try {
      await fs.access(resolvedPath);
    } catch {
      throw new FileNotFoundError(filePath);
    }

    const content = await fs.readFile(resolvedPath, "utf-8");
    const trimmed = content.trim();

    if (trimmed.length === 0) {
      throw new EmptyFileError(filePath);
    }

    return trimmed;
  }
}
