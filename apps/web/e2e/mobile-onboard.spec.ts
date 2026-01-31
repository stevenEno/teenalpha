import { test, expect } from '@playwright/test';

test.describe('Mobile Onboard Page', () => {
  test('redirects to signup when not authenticated', async ({ page }) => {
    await page.goto('/m/onboard');

    await page.waitForURL(/\/m\/signup/);
    await expect(page).toHaveURL(/\/m\/signup/);

    await page.screenshot({ path: 'test-results/onboard-redirect-to-signup.png', fullPage: true });
  });
});
