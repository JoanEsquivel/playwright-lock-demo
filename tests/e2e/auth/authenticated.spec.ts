import { test, expect } from '../../../fixtures/index.fixtures';

test.describe('Reusable customer authentication', { tag: ['@e2e'] }, () => {
  test(
    'should reuse storageState without logging in again',
    { tag: ['@smoke'] },
    async ({ homePage }) => {
      await homePage.load();
      await homePage.waitLoad();

      await expect(homePage.customerProfileLink).toBeVisible();
      await expect(homePage.logoutButton).toBeVisible();
    },
  );

  test('should open an authenticated wishlist', async ({ wishlistPage }) => {
    await wishlistPage.load();
    await wishlistPage.waitLoad();

    await expect(wishlistPage.heading).toBeVisible();
    await expect(wishlistPage.customerProfileLink).toBeVisible();
  });
});
