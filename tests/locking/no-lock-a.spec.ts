import { test, expect } from '@playwright/test';
import { useExclusiveResource } from '../../utils/exclusive-resource.js';

test('WITHOUT lock: writer A may collide', async ({}, testInfo) => {
  const acquired = await useExclusiveResource(testInfo, 'shared-account-unprotected');

  // A collision is intentionally educational, not a test failure.
  expect(typeof acquired).toBe('boolean');
});
