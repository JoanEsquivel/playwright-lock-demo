import { test, type Locator, type Page } from '@playwright/test';

export class WishlistPage {
  readonly page: Page;
  readonly url = 'shop/wishlist';
  readonly heading: Locator;
  readonly customerProfileLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page
      .getByRole('heading', { name: 'Wishlist', exact: true })
      .describe('Wishlist heading');
    this.customerProfileLink = page
      .getByRole('link', { name: 'Casey Customer' })
      .describe('Customer profile link');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Wishlist page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }
}
