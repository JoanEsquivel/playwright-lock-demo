import { test, type Locator, type Page } from '@playwright/test';

/** `account/login`: email + password form. Verified live with playwright-cli. */
export class LoginPage {
  readonly page: Page;
  readonly url = 'account/login';
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Log in', level: 1 }).describe('Log in heading');
    this.emailInput = page.getByRole('textbox', { name: 'Email' }).describe('Email input');
    this.passwordInput = page.getByRole('textbox', { name: 'Password' }).describe('Password input');
    this.loginButton = page.getByRole('button', { name: 'Log in' }).describe('Log in button');
  }

  async load(): Promise<void> {
    await this.page.goto(this.url);
  }

  async waitLoad(): Promise<void> {
    await test.step('Wait for Login page to load', async () => {
      await this.loginButton.waitFor({ state: 'visible' });
    });
  }

  async submitLoginForm(username: string, password: string): Promise<void> {
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
