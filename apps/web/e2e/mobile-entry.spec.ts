import { test, expect } from '@playwright/test';

test.describe('Mobile Entry Point', () => {
  test('redirects unauthenticated users to signup', async ({ page }) => {
    await page.goto('/m');

    await page.waitForURL(/\/m\/signup/);
    await expect(page).toHaveURL(/\/m\/signup/);

    await page.screenshot({ path: 'test-results/entry-redirect-to-signup.png', fullPage: true });
  });

  test('signup page is accessible after redirect', async ({ page }) => {
    await page.goto('/m');

    await page.waitForURL(/\/m\/signup/);
    await expect(page.getByRole('heading', { name: 'Join Teen Alpha' })).toBeVisible();
  });
});
