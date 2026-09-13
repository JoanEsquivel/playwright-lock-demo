import { test, type Locator, type Page } from '@playwright/test';

/** `shop`: store pre-screen. Verified live with playwright-cli. */
export class StorePage {
  readonly page: Page;
  readonly url = 'shop';
  readonly heading: Locator;
  readonly enterStoreLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'TAW Store', level: 1 }).describe('Store heading');
    this.enterStoreLink = page.getByRole('link', { name: 'Enter the store' }).describe('Enter the store link');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Store page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }
}
