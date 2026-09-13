import { test, expect } from '@playwright/test';

test('reuses storageState without logging in again', async ({ page }) => {
  await page.goto('');

  await expect(page.getByRole('link', { name: 'Casey Customer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('authenticated customer can open the wishlist', async ({ page }) => {
  await page.goto('shop/wishlist');

  await expect(page.getByRole('heading', { name: 'Wishlist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Casey Customer' })).toBeVisible();
});
