import { test, type Locator, type Page } from '@playwright/test';

/** `admin`: role-guarded dashboard (admin only). Verified live with playwright-cli. */
export class AdminDashboardPage {
  readonly page: Page;
  readonly url = 'admin';
  readonly heading: Locator;
  readonly sectionsNav: Locator;
  readonly totalRevenueTile: Locator;
  readonly orderCountTile: Locator;
  readonly averageOrderValueTile: Locator;
  readonly lowStockTile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Admin dashboard', level: 1 }).describe('Admin dashboard heading');
    this.sectionsNav = page.getByRole('navigation', { name: 'Admin sections' }).describe('Admin sections navigation');
    this.totalRevenueTile = page.locator('[data-testid="stat-total-revenue"]').describe('Total revenue tile');
    this.orderCountTile = page.locator('[data-testid="stat-order-count"]').describe('Orders tile');
    this.averageOrderValueTile = page.locator('[data-testid="stat-avg-order-value"]').describe('Average order value tile');
    this.lowStockTile = page.locator('[data-testid="stat-low-stock"]').describe('Low stock tile');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Admin dashboard page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }
}
