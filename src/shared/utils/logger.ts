import pc from "picocolors";
import ora, { type Ora } from "ora";

export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private verbose = false;
  private currentSpinner: Ora | null = null;

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  isVerbose(): boolean {
    return this.verbose;
  }

  spinner(message: string): Ora {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
    }
    this.currentSpinner = ora({
      text: message,
      color: "cyan"
    }).start();
    return this.currentSpinner;
  }

  stopSpinner(success = true, message?: string): void {
    if (!this.currentSpinner) return;
    if (success) {
      this.currentSpinner.succeed(message);
    } else {
      this.currentSpinner.fail(message);
    }
    this.currentSpinner = null;
  }

  info(message: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
    console.log(pc.blue("ℹ ") + message);
  }

  success(message: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
    console.log(pc.green("✔ ") + message);
  }

  warn(message: string): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
    console.warn(pc.yellow("⚠ ") + pc.yellow(message));
  }

  error(message: string, error?: unknown): void {
    if (this.currentSpinner) {
      this.currentSpinner.stop();
      this.currentSpinner = null;
    }
    console.error(pc.red("✖ ") + pc.bold(pc.red(message)));
    if (this.verbose && error) {
      console.error(pc.dim(error instanceof Error ? error.stack || String(error) : String(error)));
    }
  }

  debug(message: string, data?: unknown): void {
    if (!this.verbose) return;
    console.log(pc.gray(`[DEBUG] ${message}`));
    if (data !== undefined) {
      console.log(pc.gray(typeof data === "object" ? JSON.stringify(data, null, 2) : String(data)));
    }
  }

  box(title: string, lines: string[]): void {
    const width = Math.max(title.length, ...lines.map((l) => l.replace(/\u001b\[\d+m/g, "").length)) + 4;
    const border = "─".repeat(width);
    console.log(pc.dim(`┌${border}┐`));
    console.log(pc.bold(`│  ${title.padEnd(width - 2)}│`));
    console.log(pc.dim(`├${border}┤`));
    for (const line of lines) {
      const plainLen = line.replace(/\u001b\[\d+m/g, "").length;
      const padding = " ".repeat(Math.max(0, width - plainLen - 2));
      console.log(`│  ${line}${padding}│`);
    }
    console.log(pc.dim(`└${border}┘`));
  }
}

export const logger = new Logger();
