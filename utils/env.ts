/**
 * Central access to environment variables. Getters are lazy so a run only needs
 * the variables it actually uses. Copy `.env.example` to `.env`.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const env = {
  get BASE_URL(): string { return requireEnv('BASE_URL'); },
  /** Customer seed account: the setup project and every "session reader" test. */
  get E2E_USERNAME(): string { return requireEnv('E2E_USERNAME'); },
  get E2E_PASSWORD(): string { return requireEnv('E2E_PASSWORD'); },
  /** Admin seed account: the "session writer" test that takes over the shared session. */
  get E2E_ADMIN_USERNAME(): string { return requireEnv('E2E_ADMIN_USERNAME'); },
  get E2E_ADMIN_PASSWORD(): string { return requireEnv('E2E_ADMIN_PASSWORD'); },
};
