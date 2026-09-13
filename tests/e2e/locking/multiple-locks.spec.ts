import { test, expect } from '../../../fixtures/index.fixtures';
import { observedDelay } from '../../../utils/observation';

test.describe('Multiple protected resources', { tag: ['@e2e'] }, () => {
  test(
    'should wait for every declared lock',
    { lock: ['shared-account', 'payment-sandbox'] },
    async ({}, testInfo) => {
      await observedDelay(testInfo, 300);
      expect(testInfo.workerIndex).toBeGreaterThanOrEqual(0);
    },
  );
});
