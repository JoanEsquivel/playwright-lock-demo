import { test as setup } from '../../fixtures/index.fixtures';
import { STORAGE_STATE } from '../../playwright.config';

/**
 * Runs once per `playwright test` invocation, before the ui/e2e projects.
 * Signs in as the CUSTOMER and saves the browser session to .auth/user.json:
 * the ONE session file every other test loads through `storageState`.
 * That file is the shared resource the locks demo is about.
 */
setup('authenticate as the customer and save the shared session', { tag: ['@setup'] }, async ({ e2e, page }) => {
  await e2e.login();
  await page.context().storageState({ path: STORAGE_STATE });
});
