import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '..', '.auth', 'teen-user.json');

setup('authenticate as teen', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables are required.\n' +
      'Set them in apps/web/.env.local or pass them inline:\n' +
      '  E2E_TEST_EMAIL=test@example.com E2E_TEST_PASSWORD=secret npx playwright test'
    );
  }

  // Navigate to login
  await page.goto('/login');
  await expect(page.locator('h1')).toContainText('Teen Alpha');

  // Fill credentials
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  // Submit
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect to dashboard (Supabase auth sets cookies)
  await page.waitForURL('/dashboard', { timeout: 15000 });
  await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 });

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
