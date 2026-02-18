/**
 * Centralised environment variable validation and status reporting.
 *
 * CORE keys block server boot in production if missing.
 * OPTIONAL keys are checked at feature-level (routes/services); only reported here.
 */

/** Env vars required for the server to boot in production. */
export const CORE_ENV_KEYS = [
  'DATABASE_URL',
  'MP_ACCESS_TOKEN',
  'MP_WEBHOOK_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL',
  'ADMIN_TOKEN',
  'JWT_SECRET',
] as const;

/** Env vars for optional features (generation, storage, email, telegram). */
export const OPTIONAL_ENV_KEYS = [
  'GEMINI_API_KEY',
  'GCS_KEY_BASE64',
  'GMAIL_USER',
  'TELEGRAM_BOT_TOKEN',
] as const;

/**
 * Fail-fast validation for production.
 * Call once at boot, BEFORE registering routes.
 *
 * - Throws if any CORE key is missing.
 * - Exits with code 1 if JWT_SECRET is the insecure placeholder.
 * - No-op outside production.
 */
export function validateProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = CORE_ENV_KEYS.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars in production: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET === 'CHANGE_ME_IN_PRODUCTION') {
    console.error(
      'FATAL: JWT_SECRET is set to the insecure placeholder "CHANGE_ME_IN_PRODUCTION". Refusing to start in production.'
    );
    process.exit(1);
  }
}

/** Build a one-line status string for a list of env keys. */
function envStatus(keys: readonly string[], offLabel = 'NOT SET'): string {
  return keys.map((k) => `${k}=${process.env[k] ? 'set' : offLabel}`).join(', ');
}

/** Log Core + Optional env status to stdout (call inside app.listen callback). */
export function logEnvStatus(): void {
  console.log(`🔐 Core: ${envStatus(CORE_ENV_KEYS)}`);
  console.log(`🔌 Optional: ${envStatus(OPTIONAL_ENV_KEYS, 'off')}`);
}
