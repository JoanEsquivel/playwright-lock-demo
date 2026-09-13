import { test, expect } from '../../../fixtures/index.fixtures';
import { observedDelay } from '../../../utils/observation';

test.describe('Independent browser contexts', { tag: ['@ui'] }, () => {
  test('should load the home page independently', async ({ homePage }, testInfo) => {
    await homePage.load();
    await homePage.waitLoad();

    await expect(homePage.heading).toBeVisible();
    await observedDelay(testInfo, 400);
  });

  test('should load the store independently', async ({ storePage }, testInfo) => {
    await storePage.load();
    await storePage.waitLoad();

    await expect(storePage.heading).toBeVisible();
    await observedDelay(testInfo, 400);
  });

  test('should load the playground independently', async ({ playgroundPage }, testInfo) => {
    await playgroundPage.load();
    await playgroundPage.waitLoad();

    await expect(playgroundPage.heading).toBeVisible();
    await observedDelay(testInfo, 400);
  });
});
