import { test, expect } from '../../../fixtures/index.fixtures';
import { useExclusiveResource } from '../../../utils/exclusive-resource';

test.describe('Protected shared resource A', { tag: ['@e2e'] }, () => {
  test(
    'should give writer A exclusive access',
    { lock: 'shared-account' },
    async ({}, testInfo) => {
      const acquired = await useExclusiveResource(testInfo, 'shared-account');
      expect(acquired).toBe(true);
    },
  );
});
