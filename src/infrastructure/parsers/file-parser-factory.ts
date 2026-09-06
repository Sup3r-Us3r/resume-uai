import path from "node:path";
import type { FileParser } from "../../application/ports/file-parser.js";
import { UnsupportedFormatError } from "../../shared/errors/app-error.js";
import { TextParser } from "./text-parser.js";
import { MarkdownParser } from "./markdown-parser.js";
import { PdfParser } from "./pdf-parser.js";

export class FileParserFactory {
  private static parsers: FileParser[] = [
    new TextParser(),
    new MarkdownParser(),
    new PdfParser()
  ];

  public static getParser(filePath: string): FileParser {
    const ext = path.extname(filePath).toLowerCase();

    for (const parser of this.parsers) {
      if (parser.supports(ext)) {
        return parser;
      }
    }

    throw new UnsupportedFormatError(ext || "unknown (no extension)");
  }

  public static registerParser(parser: FileParser): void {
    this.parsers.push(parser);
  }
}
