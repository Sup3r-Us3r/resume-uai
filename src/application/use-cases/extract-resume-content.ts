import { FileParserFactory } from "../../infrastructure/parsers/file-parser-factory.js";

export class ExtractResumeContent {
  async execute(filePath: string): Promise<string> {
    const parser = FileParserFactory.getParser(filePath);
    return await parser.parse(filePath);
  }
}
