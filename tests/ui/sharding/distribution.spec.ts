import { test, expect } from '../../../fixtures/index.fixtures';
import { observedDelay } from '../../../utils/observation';

test.describe('Shard distribution', { tag: ['@ui'] }, () => {
  for (const scenario of [
    'catalog search',
    'product details',
    'wishlist read',
    'cart read',
    'profile read',
    'playground read',
  ]) {
    test(`should distribute ${scenario}`, async ({}, testInfo) => {
      await observedDelay(testInfo, 150);
      expect(testInfo.parallelIndex).toBeGreaterThanOrEqual(0);
    });
  }
});
