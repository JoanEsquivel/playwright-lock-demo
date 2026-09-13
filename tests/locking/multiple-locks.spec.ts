import { test, expect } from '@playwright/test';
import { observedDelay } from '../../utils/observation.js';

test(
  'a test can atomically wait for multiple named locks',
  { lock: ['shared-account', 'payment-sandbox'] },
  async ({}, testInfo) => {
    await observedDelay(testInfo, 300);
    expect(testInfo.workerIndex).toBeGreaterThanOrEqual(0);
  },
);
