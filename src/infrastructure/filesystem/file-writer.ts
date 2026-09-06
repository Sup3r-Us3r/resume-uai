import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../shared/errors/app-error.js";

export class FileWriter {
  public static async write(
    targetPath: string,
    content: string | Buffer
  ): Promise<string> {
    const resolvedPath = path.resolve(targetPath);
    const parentDir = path.dirname(resolvedPath);

    try {
      await fs.mkdir(parentDir, { recursive: true });
      await fs.writeFile(resolvedPath, content);
      return resolvedPath;
    } catch (err) {
      throw new AppError(
        `Failed to write output file "${targetPath}": ${err instanceof Error ? err.message : String(err)}`,
        "FILE_ERROR",
        err
      );
    }
  }
}
