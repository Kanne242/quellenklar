import { z } from 'zod';

/**
 * Konfiguration ausschließlich aus Umgebungsvariablen. Geheimnisse werden nie geloggt
 * und nie an den Client ausgeliefert.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  SUPABASE_URL: z.url({ error: 'SUPABASE_URL muss eine gültige URL sein.' }),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY fehlt.'),
  /** Nur für serverseitige Verwaltungsaufgaben (z. B. Kontolöschung). Optional in Phase 1. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  /** Ab Phase 3 erforderlich. */
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-sonnet-5-5'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `- ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Ungültige Server-Konfiguration:\n${problems}`);
  }
  return parsed.data;
}
