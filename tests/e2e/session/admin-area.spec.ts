import { readFile, writeFile } from 'node:fs/promises';
import { test, expect } from '../../../fixtures/index.fixtures';
import { STORAGE_STATE } from '../../../playwright.config';
import accounts from '../../../data/accounts.json';

/**
 * SESSION WRITER. The suite keeps ONE signed-in session file (.auth/user.json).
 * This spec needs the ADMIN role, so it signs in as admin, takes over that file,
 * checks the admin area, and finally signs back in as the customer and hands
 * the file back exactly as it found it.
 *
 * While it holds the file, any "session reader" that starts would load the
 * ADMIN session and fail. `lock: 'shared-session'` prevents that: readers and
 * this writer never overlap, while every other test keeps running in parallel.
 *
 * A lock gives exclusive access, not cleanup: if this test crashed halfway the
 * file would stay "admin" for the rest of the run. The hooks below keep a copy
 * of the customer session and always put it back, pass or fail.
 */
test.describe('Admin area', { tag: ['@e2e'], lock: 'shared-session' }, () => {
  // Start logged out: this test creates its own sessions.
  test.use({ storageState: { cookies: [], origins: [] } });

  let customerSession: Buffer;

  test.beforeEach(async () => {
    customerSession = await readFile(STORAGE_STATE);
  });

  test.afterEach(async () => {
    // Runs before the lock is released, so no reader can see a half-restored file.
    await writeFile(STORAGE_STATE, customerSession);
  });

  test(
    'should take over the shared session as admin and hand it back to the customer',
    { tag: ['@regression'] },
    async ({ e2e, homePage, adminDashboardPage, profilePage, page }) => {
      await test.step('Sign in as admin and overwrite the shared session file', async () => {
        await e2e.loginAsAdmin();
        await page.context().storageState({ path: STORAGE_STATE });
      });

      await expect(homePage.userNameLink).toHaveText(accounts.admin.displayName);
      await expect(homePage.adminLink).toBeVisible();

      await test.step('Open the admin dashboard', async () => {
        await adminDashboardPage.load();
        await adminDashboardPage.waitLoad();
      });

      await expect(adminDashboardPage.sectionsNav).toBeVisible();
      await expect(adminDashboardPage.totalRevenueTile).toBeVisible();
      await expect(adminDashboardPage.orderCountTile).toBeVisible();
      await expect(adminDashboardPage.averageOrderValueTile).toBeVisible();
      await expect(adminDashboardPage.lowStockTile).toBeVisible();

      await test.step('Check the admin profile', async () => {
        await profilePage.load();
        await profilePage.waitLoad();
      });

      await expect(profilePage.roleBadge).toHaveText(accounts.admin.role);

      await test.step('Hand the shared session back to the customer', async () => {
        await e2e.logout();
        await e2e.login();
        await page.context().storageState({ path: STORAGE_STATE });
      });

      await expect(homePage.userNameLink).toHaveText(accounts.customer.displayName);
      await expect(homePage.adminLink).toBeHidden();
    },
  );
});
