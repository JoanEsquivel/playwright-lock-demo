import { test, type Locator, type Page } from '@playwright/test';

export class StorePage {
  readonly page: Page;
  readonly url = 'shop';
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page
      .getByRole('heading', { name: 'TAW Store' })
      .describe('TAW Store heading');
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
