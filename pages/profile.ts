import { test, type Locator, type Page } from '@playwright/test';

/** `account/profile`: account details of the signed-in user. Verified live with playwright-cli. */
export class ProfilePage {
  readonly page: Page;
  readonly url = 'account/profile';
  readonly heading: Locator;
  readonly roleBadge: Locator;
  readonly email: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Profile', level: 1 }).describe('Profile heading');
    this.roleBadge = page.locator('[data-testid="profile-role"]').describe('Profile role badge');
    this.email = page.locator('[data-testid="profile-email"]').describe('Profile email');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Profile page to load', async () => {
      await this.heading.waitFor({ state: 'visible' });
    });
  }
}
