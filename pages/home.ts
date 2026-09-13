import { test, type Locator, type Page } from '@playwright/test';

/**
 * `./` (home) plus the site header, which is the same on every page:
 * the signed-in user's name, the Admin shortcut (admin role only), Log in / Log out.
 * Verified live with playwright-cli.
 */
export class HomePage {
  readonly page: Page;
  readonly url = './';
  readonly heading: Locator;
  readonly userNameLink: Locator;
  readonly adminLink: Locator;
  readonly logoutButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page
      .getByRole('heading', { name: 'A place to practise test automation', level: 1 })
      .describe('Home heading');
    // The link text is the user's display name, so the test id is the stable handle.
    this.userNameLink = page.locator('[data-testid="user-name"]').describe('Header user name link');
    this.adminLink = page.getByRole('link', { name: 'Admin', exact: true }).describe('Header Admin link');
    this.logoutButton = page.getByRole('button', { name: 'Log out' }).describe('Header Log out button');
    this.loginLink = page.getByRole('link', { name: 'Log in' }).describe('Header Log in link');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Home page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }

  async openProfile(): Promise<void> {
    await this.userNameLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
