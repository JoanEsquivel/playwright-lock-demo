import { test, expect } from '@playwright/test';
import { useExclusiveResource } from '../../utils/exclusive-resource.js';

test('WITHOUT lock: writer B may collide', async ({}, testInfo) => {
  const acquired = await useExclusiveResource(testInfo, 'shared-account');

  // Inspect demo-output/timeline.jsonl for "collision".
  expect(typeof acquired).toBe('boolean');
});
