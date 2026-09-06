import pc from "picocolors";
import { ValidateResume } from "../../application/use-cases/validate-resume.js";
import { logger } from "../../shared/utils/logger.js";
import { AppError } from "../../shared/errors/app-error.js";

export interface ValidateCommandOptions {
  verbose?: boolean;
}

export async function validateCommand(
  inputFile: string,
  options: ValidateCommandOptions
): Promise<void> {
  if (options.verbose) {
    logger.setVerbose(true);
  }

  const spinner = logger.spinner(`Validating ATS compliance for "${inputFile}"...`);

  try {
    const useCase = new ValidateResume();
    const result = await useCase.execute(inputFile);
    spinner.succeed("ATS validation complete.");

    const ats = result.analysis;
    let scoreColor = pc.green;
    if (ats.level === "Poor") scoreColor = pc.red;
    else if (ats.level === "Needs Improvement") scoreColor = pc.yellow;
    else if (ats.level === "Good") scoreColor = pc.cyan;

    console.log();
    logger.box("ATS Diagnostics Summary", [
      `File Analyzed:  ${result.filePath}`,
      `Overall Score:  ${scoreColor(pc.bold(`${ats.score}/${ats.maxScore}`))} (${scoreColor(ats.level)})`,
      `Passed Checks:  ${ats.passedCount} of ${ats.totalCount}`,
      `Extracted Text: ${result.extractedTextLength} characters`
    ]);

    console.log(pc.bold("\nDetailed Check Results:"));
    for (const check of ats.checks) {
      const mark = check.passed ? pc.green("✔") : pc.red("✖");
      const scoreBadge = pc.dim(`[${check.score}/${check.maxScore} pts]`);
      console.log(`  ${mark} ${pc.bold(check.name)} ${scoreBadge}`);
      console.log(`     ${pc.dim(check.feedback)}`);
    }

    if (ats.suggestions.length > 0) {
      console.log(pc.bold("\nActionable ATS Recommendations:"));
      for (const sug of ats.suggestions) {
        console.log(`  ${pc.yellow("•")} ${sug}`);
      }
    }

    console.log();
    if (ats.score < 60) {
      process.exitCode = 1;
    }
  } catch (err: unknown) {
    spinner.fail("ATS validation failed.");

    if (err instanceof AppError) {
      logger.error(`[${err.category}] ${err.message}`, err.details);
    } else {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Unexpected error: ${message}`, err);
    }

    if (!options.verbose) {
      console.log(pc.dim("\nTip: Run with --verbose to view detailed error stack traces."));
    }

    process.exitCode = 1;
  }
}
