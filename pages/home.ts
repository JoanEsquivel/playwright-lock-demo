import { test, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly url = '/';
  readonly heading: Locator;
  readonly customerProfileLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page
      .getByRole('heading', { name: 'A place to practise test automation' })
      .describe('Practice automation heading');
    this.customerProfileLink = page
      .getByRole('link', { name: 'Casey Customer' })
      .describe('Customer profile link');
    this.logoutButton = page.getByRole('button', { name: 'Log out' }).describe('Log out button');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Home page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }
}
