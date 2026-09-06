import { Command } from "commander";
import { generateCommand } from "./commands/generate.js";
import { validateCommand } from "./commands/validate.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("resume-ai")
    .description("CLI tool to transform raw professional profiles into ATS-optimized Markdown and PDF resumes")
    .version("1.0.0");

  program
    .command("generate")
    .description("Generate an ATS-optimized resume in Markdown and PDF from a source file (.txt, .md, .pdf)")
    .argument("<file>", "Path to the input file containing professional profile information")
    .option("-o, --output <dir>", "Output directory for generated resume files", "./output")
    .option("-t, --template <path>", "Path to a custom Markdown template")
    .option("-m, --model <model>", "Google Gemini model name (defaults to GEMINI_MODEL env or gemini-3.5-flash)")
    .option("-j, --job <path>", "Path to target Job Description file for keyword alignment")
    .option("-l, --lang <lang>", "Target resume language (pt | en, defaults to DEFAULT_LANG env or pt)", "pt")
    .option("--mock", "Use deterministic Mock AI provider (offline / testing mode)")
    .option("-v, --verbose", "Enable verbose logging for debugging")
    .action(async (file, options) => {
      await generateCommand(file, options);
    });

  program
    .command("validate")
    .description("Deterministically analyze an existing resume (.md, .pdf, .txt) against ATS structural standards")
    .argument("<file>", "Path to the resume file to analyze")
    .option("-v, --verbose", "Display verbose debug details")
    .action(async (file, options) => {
      await validateCommand(file, options);
    });

  return program;
}
