import { test, expect } from '@playwright/test';
import { observedDelay } from '../../utils/observation.js';

test.describe('independent browser contexts', () => {
  test('home page', async ({ page }, testInfo) => {
    await page.goto('');
    await expect(
      page.getByRole('heading', { name: 'A place to practise test automation' }),
    ).toBeVisible();
    await observedDelay(testInfo, 400);
  });

  test('store catalog', async ({ page }, testInfo) => {
    await page.goto('shop');
    await expect(page.getByRole('heading', { name: /Store/i })).toBeVisible();
    await observedDelay(testInfo, 400);
  });

  test('components playground', async ({ page }, testInfo) => {
    await page.goto('playground');
    await expect(page.getByRole('heading', { name: /playground/i })).toBeVisible();
    await observedDelay(testInfo, 400);
  });
});
