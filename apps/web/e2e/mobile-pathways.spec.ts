import { test, expect } from '@playwright/test';

test.describe('Mobile Pathways Page', () => {
  test('redirects to signup when not authenticated', async ({ page }) => {
    await page.goto('/m/pathways');

    await page.waitForURL(/\/m\/signup/);
    await expect(page).toHaveURL(/\/m\/signup/);

    await page.screenshot({ path: 'test-results/pathways-redirect-to-signup.png', fullPage: true });
  });
});
