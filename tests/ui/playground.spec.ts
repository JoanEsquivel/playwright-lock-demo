import { test, expect } from '../../fixtures/index.fixtures';

/**
 * Independent public pages. They do not care who is signed in, so they declare
 * NO lock: while the session tests take turns, these keep running in parallel.
 */
test.describe('Public pages', { tag: ['@ui'] }, () => {
  test('should show the playground categories', { tag: ['@smoke'] }, async ({ playgroundPage }) => {
    await test.step('Load Playground page', async () => {
      await playgroundPage.load();
      await playgroundPage.waitLoad();
    });

    await expect(playgroundPage.heading).toBeVisible();
    await expect(playgroundPage.categories).toBeVisible();
  });

  test('should show the store entrance', { tag: ['@smoke'] }, async ({ storePage }) => {
    await test.step('Load Store page', async () => {
      await storePage.load();
      await storePage.waitLoad();
    });

    await expect(storePage.heading).toBeVisible();
    await expect(storePage.enterStoreLink).toBeVisible();
  });

  test('should show the home headline', { tag: ['@smoke'] }, async ({ homePage }) => {
    await test.step('Load Home page', async () => {
      await homePage.load();
      await homePage.waitLoad();
    });

    await expect(homePage.heading).toBeVisible();
    await expect(homePage.page).toHaveTitle('The Test Automation Website');
  });
});
