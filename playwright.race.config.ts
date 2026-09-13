import { defineConfig, devices } from '@playwright/test';
import baseConfig, { STORAGE_STATE } from './playwright.config';

/**
 * The "what goes wrong WITHOUT locks" run (`pnpm demo:race`).
 *
 * Same framework, same fixtures, same page objects. The only differences:
 * - it runs the copies in tests/demo/race, which have NO `lock` option;
 * - 4 workers, no retries (a retry would hide the collision);
 * - every test is repeated three times so the overlap on .auth/user.json is easy to hit.
 *
 * No project in the base config points at tests/demo, so `pnpm test` never runs these.
 */
export default defineConfig({
  ...baseConfig,
  retries: 0,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : 4,
  // No `github` reporter here: the failures are expected and must not annotate a PR.
  reporter: process.env.CI ? [['blob'], ['list']] : [['html', { open: 'never' }], ['list']],
  use: { ...baseConfig.use, trace: 'retain-on-failure' },
  projects: [
    { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'demo-race',
      testDir: './tests/demo/race',
      // Kept at project level to make the intent explicit: only the race specs repeat.
      repeatEach: 3,
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
});
