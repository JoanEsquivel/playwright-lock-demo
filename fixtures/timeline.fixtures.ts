import { test as base } from '@playwright/test';

/**
 * Teaching aid for the locks demo: prints when every test starts and ends and on
 * which worker slot, so the `list` reporter shows which tests overlapped.
 * `parallelIndex` is the stable slot number (0..workers-1); `workerIndex` grows
 * every time a worker process restarts, which makes timelines harder to read.
 */
export const timelineFixture = base.extend<{ timeline: void }>({
  timeline: [
    async ({}, use, testInfo) => {
      const stamp = (): string => new Date().toISOString().slice(11, 23);
      const label = `[worker ${testInfo.parallelIndex}] ${testInfo.title} (run ${testInfo.repeatEachIndex + 1})`;
      console.log(`${stamp()} ▶ start  ${label}`);
      await use();
      console.log(`${stamp()} ■ end    ${label} → ${testInfo.status ?? 'unknown'}`);
    },
    { auto: true },
  ],
});
