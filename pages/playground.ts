import { test, type Locator, type Page } from '@playwright/test';

/** `playground`: hub of the UI widget categories. Verified live with playwright-cli. */
export class PlaygroundPage {
  readonly page: Page;
  readonly url = 'playground';
  readonly heading: Locator;
  readonly categories: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Components Playground', level: 1 }).describe('Playground heading');
    this.categories = page.getByRole('region', { name: 'Playground categories' }).describe('Playground categories region');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Playground page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }
}
