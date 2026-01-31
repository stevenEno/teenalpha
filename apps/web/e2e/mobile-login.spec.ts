import { test, expect } from '@playwright/test';

test.describe('Mobile Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/m/login');
  });

  test('renders login page with all elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByText('Sign in to continue your journey')).toBeVisible();

    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Your password')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible();

    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });
  });

  test('submit button is disabled when form is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeDisabled();
  });

  test('submit button enables when form is valid', async ({ page }) => {
    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByPlaceholder('Your password').fill('a');

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();

    await page.screenshot({ path: 'test-results/login-form-filled.png', fullPage: true });
  });

  test('sign up link navigates to signup page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/m\/signup/);
  });

  test('forgot password link points to correct page', async ({ page }) => {
    const link = page.getByRole('link', { name: 'Forgot your password?' });
    await expect(link).toHaveAttribute('href', '/forgot-password');
  });

  test('form fields accept input correctly', async ({ page }) => {
    const emailInput = page.getByPlaceholder('your@email.com');
    const passwordInput = page.getByPlaceholder('Your password');

    await emailInput.fill('user@test.com');
    await expect(emailInput).toHaveValue('user@test.com');

    await passwordInput.fill('mypassword');
    await expect(passwordInput).toHaveValue('mypassword');
  });

  test('mobile viewport renders properly', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);

    await page.screenshot({ path: 'test-results/login-mobile-viewport.png', fullPage: true });
  });
});
