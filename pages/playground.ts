import { test, type Locator, type Page } from '@playwright/test';

export class PlaygroundPage {
  readonly page: Page;
  readonly url = 'playground';
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page
      .getByRole('heading', { name: 'Components Playground' })
      .describe('Components Playground heading');
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
