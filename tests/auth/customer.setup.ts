import { mkdir } from 'node:fs/promises';
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/customer.json';

setup('authenticate once as the seeded customer', async ({ page }) => {
  await page.goto('account/login');
  await page.getByLabel('Email').fill('customer@example.com');
  await page.getByLabel('Password').fill('Password123!');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page.getByRole('link', { name: 'Casey Customer' })).toBeVisible();
  await mkdir('playwright/.auth', { recursive: true });
  await page.context().storageState({ path: authFile });
});
