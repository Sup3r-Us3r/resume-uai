export type ErrorCategory =
  | "CONFIG_ERROR"
  | "FILE_ERROR"
  | "PARSER_ERROR"
  | "AI_ERROR"
  | "VALIDATION_ERROR"
  | "RENDER_ERROR"
  | "CLI_ERROR";

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly details?: unknown;

  constructor(message: string, category: ErrorCategory = "CLI_ERROR", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.category = category;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "CONFIG_ERROR", details);
    this.name = "ConfigError";
  }
}

export class FileNotFoundError extends AppError {
  constructor(filePath: string) {
    super(`File not found: "${filePath}"`, "FILE_ERROR");
    this.name = "FileNotFoundError";
  }
}

export class UnsupportedFormatError extends AppError {
  constructor(extension: string) {
    super(
      `Unsupported file format: "${extension}". Supported formats: .txt, .md, .pdf`,
      "PARSER_ERROR"
    );
    this.name = "UnsupportedFormatError";
  }
}

export class EmptyFileError extends AppError {
  constructor(filePath: string) {
    super(`The input file is empty or contains no extractable text: "${filePath}"`, "PARSER_ERROR");
    this.name = "EmptyFileError";
  }
}

export class AIProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "AI_ERROR", details);
    this.name = "AIProviderError";
  }
}

export class SchemaValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "SchemaValidationError";
  }
}

export class RenderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "RENDER_ERROR", details);
    this.name = "RenderError";
  }
}
