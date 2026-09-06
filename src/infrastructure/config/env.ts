import dotenv from 'dotenv';
import { z } from 'zod';
import { ConfigError } from '../../shared/errors/app-error.js';

dotenv.config();

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-3.5-flash-lite'),
  GEMINI_FALLBACK_MODEL: z.string().optional().default('gemini-3.5-flash'),
  DEFAULT_LANG: z.enum(['pt', 'en']).optional().default('pt'),
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .optional()
    .default('info'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadConfig(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new ConfigError(`Invalid environment configuration: ${errorDetails}`);
  }
  return result.data;
}

export function validateApiKey(apiKey?: string): string {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key.includes('your_gemini_api_key')) {
    throw new ConfigError(
      'GEMINI_API_KEY is not set or is empty. Please set it in your environment or in a .env file.',
    );
  }
  return key;
}
