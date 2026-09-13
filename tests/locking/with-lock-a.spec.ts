import { test, expect } from '@playwright/test';
import { useExclusiveResource } from '../../utils/exclusive-resource.js';

test(
  'WITH lock: writer A gets exclusive access',
  { lock: 'shared-account' },
  async ({}, testInfo) => {
    const acquired = await useExclusiveResource(testInfo, 'shared-account');
    expect(acquired).toBe(true);
  },
);
