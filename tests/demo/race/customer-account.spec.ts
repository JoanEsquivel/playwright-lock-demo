// DEMO COPY of tests/e2e/session/customer-account.spec.ts WITHOUT the lock.
// Only `pnpm demo:race` (playwright.race.config.ts) runs this folder. Expected to FAIL when a writer overlaps.
import { test, expect } from '../../../fixtures/index.fixtures';
import { env } from '../../../utils/env';
import accounts from '../../../data/accounts.json';

/**
 * SESSION READERS. Every test here starts from the shared session file
 * (.auth/user.json, written by the setup project) and asserts that it is the
 * CUSTOMER who is signed in.
 *
 * `lock: 'shared-session'` — declared on the whole group — means none of these
 * tests can run while another test holding the same lock name is running,
 * anywhere in the run (other files, other workers, other projects). The only
 * other holder is the Admin area spec, which temporarily rewrites that file.
 */
test.describe('Customer account', { tag: ['@e2e'] }, () => {
  test.beforeEach(async ({ homePage }) => {
    await test.step('Load Home page with the shared session', async () => {
      await homePage.load();
      await homePage.waitLoad();
    });
  });

  test('should show the customer name in the header', { tag: ['@smoke'] }, async ({ homePage }) => {
    await expect(homePage.userNameLink).toHaveText(accounts.customer.displayName);
  });

  test('should hide the admin shortcut for a customer', { tag: ['@smoke'] }, async ({ homePage }) => {
    await expect(homePage.userNameLink).toBeVisible();
    await expect(homePage.adminLink).toBeHidden();
  });

  test('should open the customer profile from the header', { tag: ['@smoke'] }, async ({ homePage, profilePage }) => {
    await homePage.openProfile();
    await profilePage.waitLoad();
    await expect(profilePage.roleBadge).toHaveText(accounts.customer.role);
    await expect(profilePage.email).toHaveText(env.E2E_USERNAME);
  });
});
