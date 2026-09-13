import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login';
import { HomePage } from '../pages/home';
import { PlaygroundPage } from '../pages/playground';
import { StorePage } from '../pages/store';
import { WishlistPage } from '../pages/wishlist';

export interface PageFixtures {
  loginPage: LoginPage;
  homePage: HomePage;
  playgroundPage: PlaygroundPage;
  storePage: StorePage;
  wishlistPage: WishlistPage;
}

export const pageFixture = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  homePage: async ({ page }, use) => { await use(new HomePage(page)); },
  playgroundPage: async ({ page }, use) => { await use(new PlaygroundPage(page)); },
  storePage: async ({ page }, use) => { await use(new StorePage(page)); },
  wishlistPage: async ({ page }, use) => { await use(new WishlistPage(page)); },
});
