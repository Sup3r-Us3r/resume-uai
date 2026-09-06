import path from 'node:path';
import pc from 'picocolors';
import { GenerateResume } from '../../application/use-cases/generate-resume.js';
import { GenkitProvider } from '../../infrastructure/ai/genkit-provider.js';
import { MockAIProvider } from '../../infrastructure/ai/mock-ai-provider.js';
import { loadConfig, validateApiKey } from '../../infrastructure/config/env.js';
import { logger } from '../../shared/utils/logger.js';
import { AppError, ConfigError } from '../../shared/errors/app-error.js';
import type { AIProvider, SupportedLanguage } from '../../application/ports/ai-provider.js';

export interface GenerateCommandOptions {
  output?: string;
  template?: string;
  model?: string;
  job?: string;
  lang?: string;
  mock?: boolean;
  verbose?: boolean;
}

export async function generateCommand(
  inputFile: string,
  options: GenerateCommandOptions,
): Promise<void> {
  if (options.verbose) {
    logger.setVerbose(true);
  }

  const spinner = logger.spinner(
    'Reading input file and checking environment...',
  );

  try {
    const config = loadConfig();
    const useMock = options.mock || process.env.USE_MOCK_AI === 'true';

    const rawLang = (options.lang || config.DEFAULT_LANG || 'pt').toLowerCase();
    if (rawLang !== 'pt' && rawLang !== 'en') {
      throw new ConfigError(`Invalid language "${options.lang}". Supported options: pt, en`);
    }
    const lang: SupportedLanguage = rawLang as SupportedLanguage;

    let aiProvider: AIProvider;
    if (useMock) {
      logger.debug('Using MockAIProvider (deterministic testing mode)');
      aiProvider = new MockAIProvider();
    } else {
      const apiKey = validateApiKey(config.GEMINI_API_KEY);
      const model = options.model || config.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      const fallbackModel = config.GEMINI_FALLBACK_MODEL || 'gemini-3.5-flash';
      logger.debug(`Using GenkitProvider with model: ${model} (fallback: ${fallbackModel})`);

      aiProvider = new GenkitProvider({
        apiKey,
        model,
        fallbackModel,
        onRetry: (info) => {
          const delaySec = (info.delayMs / 1000).toFixed(1);
          spinner.text = pc.yellow(
            `Model ${info.model} high demand/busy. Retrying in ${delaySec}s (attempt ${info.attempt}/${info.maxRetries})...`,
          );
          logger.debug(`Retry triggered: attempt ${info.attempt}, delay ${info.delayMs}ms, error: ${info.error.message}`);
        },
        onFallback: (info) => {
          spinner.text = pc.cyan(
            `Model ${info.fromModel} busy/exhausted. Switching to fallback model ${info.toModel}...`,
          );
          logger.debug(`Model fallback triggered: ${info.fromModel} -> ${info.toModel} (Reason: ${info.reason})`);
        }
      });
    }

    spinner.text = 'Extracting content from input file...';
    const useCase = new GenerateResume(aiProvider);

    spinner.text = `Analyzing profile and optimizing for ATS in ${lang === 'pt' ? 'Portuguese' : 'English'} via Genkit...`;
    const result = await useCase.execute({
      filePath: inputFile,
      outputDir: options.output || './output',
      templatePath: options.template,
      jobDescriptionPath: options.job,
      lang,
    });

    spinner.succeed(pc.green('Resume generated and optimized successfully!'));

    console.log();
    // Display ATS Score summary
    const ats = result.atsAnalysis;
    let scoreColor = pc.green;
    if (ats.level === 'Poor') scoreColor = pc.red;
    else if (ats.level === 'Needs Improvement') scoreColor = pc.yellow;
    else if (ats.level === 'Good') scoreColor = pc.cyan;

    logger.box('ATS Structural Compliance', [
      `Overall Score:  ${scoreColor(pc.bold(`${ats.score}/${ats.maxScore}`))} (${scoreColor(ats.level)})`,
      `Passed Checks:  ${ats.passedCount} of ${ats.totalCount}`,
      `Language:       ${lang === 'pt' ? 'Português (pt)' : 'English (en)'}`,
      `Candidate:      ${result.resume.personal.name} — ${result.resume.headline}`,
      `Skills Found:   ${ats.metrics.totalSkills} keywords across categories`,
      `Action Verbs:   ${ats.metrics.actionVerbsFound} detected in experience bullets`,
    ]);

    if (ats.suggestions.length > 0 && options.verbose) {
      console.log(pc.bold('\nATS Recommendations:'));
      for (const sug of ats.suggestions) {
        console.log(`  ${pc.yellow('•')} ${sug}`);
      }
    }

    console.log(pc.bold('\nGenerated Files:'));
    console.log(
      `  ${pc.cyan('Markdown:')} ${path.relative(process.cwd(), result.markdownPath)}`,
    );
    console.log(
      `  ${pc.cyan('PDF:')}      ${path.relative(process.cwd(), result.pdfPath)}`,
    );
    console.log();
  } catch (err: unknown) {
    spinner.fail('Resume generation failed.');

    if (err instanceof AppError) {
      logger.error(`[${err.category}] ${err.message}`, err.details);
    } else {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`Unexpected error: ${message}`, err);
    }

    if (!options.verbose) {
      console.log(
        pc.dim(
          '\nTip: Run with --verbose to view detailed error stack traces.',
        ),
      );
    }

    process.exitCode = 1;
  }
}
