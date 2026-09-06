export interface FileParser {
  /**
   * Reads and extracts textual content from a supported file format.
   * @param filePath Absolute or relative path to the file.
   * @returns Clean, trimmed plain text content.
   */
  parse(filePath: string): Promise<string>;

  /**
   * Returns true if this parser supports the given extension.
   * @param extension Lowercase extension with leading dot (e.g. '.md').
   */
  supports(extension: string): boolean;
}
