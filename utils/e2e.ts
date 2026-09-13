import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login';
import { HomePage } from '../pages/home';
import { env } from './env';

/**
 * Multi-page flows. Action-only, except for the documented "bridge guard":
 * an `expect` that confirms a page transition happened so the next step is safe.
 */
export class E2E {
  readonly loginPage: LoginPage;
  readonly homePage: HomePage;

  constructor(readonly page: Page) {
    this.loginPage = new LoginPage(page);
    this.homePage = new HomePage(page);
  }

  /** Sign in as the customer seed account; lands on the home page. */
  async login(): Promise<void> {
    await test.step('Login as the customer E2E user', async () => {
      await this.signIn(env.E2E_USERNAME, env.E2E_PASSWORD);
    });
  }

  /** Sign in as the admin seed account; lands on the home page. */
  async loginAsAdmin(): Promise<void> {
    await test.step('Login as the admin E2E user', async () => {
      await this.signIn(env.E2E_ADMIN_USERNAME, env.E2E_ADMIN_PASSWORD);
    });
  }

  /** Sign out from the header; lands on the home page logged out. */
  async logout(): Promise<void> {
    await test.step('Logout from the header', async () => {
      await this.homePage.logout();
      // Bridge guard: confirms the transition, not a test outcome.
      await expect(this.homePage.loginLink).toBeVisible();
    });
  }

  private async signIn(username: string, password: string): Promise<void> {
    await this.loginPage.load();
    await this.loginPage.waitLoad();
    await this.loginPage.submitLoginForm(username, password);
    await this.homePage.waitLoad();
    // Bridge guard: the header shows the signed-in user once the session is stored.
    await expect(this.homePage.userNameLink).toBeVisible();
  }
}
