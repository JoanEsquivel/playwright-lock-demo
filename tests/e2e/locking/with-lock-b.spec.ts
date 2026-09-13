import { test, expect } from '../../../fixtures/index.fixtures';
import { useExclusiveResource } from '../../../utils/exclusive-resource';

test.describe('Protected shared resource B', { tag: ['@e2e'] }, () => {
  test(
    'should make writer B wait for the same named lock',
    { lock: 'shared-account' },
    async ({}, testInfo) => {
      const acquired = await useExclusiveResource(testInfo, 'shared-account');
      expect(acquired).toBe(true);
    },
  );
});
