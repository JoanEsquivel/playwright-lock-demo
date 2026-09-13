import { test, expect } from '@playwright/test';
import { observedDelay } from '../../utils/observation.js';

for (const scenario of [
  'catalog search',
  'product details',
  'wishlist read',
  'cart read',
  'profile read',
  'playground read',
]) {
  test(`shardable: ${scenario}`, async ({}, testInfo) => {
    await observedDelay(testInfo, 150);
    expect(testInfo.parallelIndex).toBeGreaterThanOrEqual(0);
  });
}
