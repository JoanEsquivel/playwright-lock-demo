import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login';
import { HomePage } from '../pages/home';
import { ProfilePage } from '../pages/profile';
import { AdminDashboardPage } from '../pages/admin-dashboard';
import { PlaygroundPage } from '../pages/playground';
import { StorePage } from '../pages/store';

export interface PageFixtures {
  loginPage: LoginPage;
  homePage: HomePage;
  profilePage: ProfilePage;
  adminDashboardPage: AdminDashboardPage;
  playgroundPage: PlaygroundPage;
  storePage: StorePage;
}

export const pageFixture = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  profilePage: async ({ page }, use) => { await use(new ProfilePage(page)); },
  adminDashboardPage: async ({ page }, use) => { await use(new AdminDashboardPage(page)); },
  playgroundPage: async ({ page }, use) => { await use(new PlaygroundPage(page)); },
  storePage: async ({ page }, use) => { await use(new StorePage(page)); },
});
