import { test, expect } from '../../../fixtures/index.fixtures';
import { useExclusiveResource } from '../../../utils/exclusive-resource';

test.describe('Unprotected shared resource A', { tag: ['@e2e'] }, () => {
  test('should expose that writer A may collide', async ({}, testInfo) => {
    const acquired = await useExclusiveResource(testInfo, 'shared-account-unprotected');

    expect(typeof acquired).toBe('boolean');
  });
});
