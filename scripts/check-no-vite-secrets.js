/**
 * Pre-build guardrail: blocks the build if dangerous secrets are
 * exposed via VITE_ env prefix (which Vite injects into the browser bundle).
 *
 * Run automatically via "prebuild" in package.json.
 * Add new keys to FORBIDDEN_VITE_KEYS if needed.
 */

const FORBIDDEN_VITE_KEYS = [
  'VITE_GEMINI_API_KEY',
];

const leaked = FORBIDDEN_VITE_KEYS.filter(
  (key) => process.env[key] && process.env[key].trim() !== ''
);

if (leaked.length > 0) {
  console.error(
    `\n❌  BUILD BLOCKED — dangerous VITE_ secret(s) detected in environment:\n` +
      leaked.map((k) => `   • ${k}`).join('\n') +
      `\n\nThese keys would be embedded in the browser bundle by Vite.\n` +
      `Remove them from the frontend .env and keep them only in server/.env.\n`
  );
  process.exit(1);
}

console.log('✅  No forbidden VITE_ secrets detected — build may proceed.');
