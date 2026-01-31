import { test, expect } from '@playwright/test';

test.describe('Mobile Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/m/signup');
  });

  test('renders signup page with all elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Join Teen Alpha' })).toBeVisible();
    await expect(page.getByText('Discover your path to building something amazing')).toBeVisible();

    await expect(page.getByPlaceholder('What should we call you?')).toBeVisible();
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByText('At least 6 characters')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    await page.screenshot({ path: 'test-results/signup-page.png', fullPage: true });
  });

  test('submit button is disabled when form is empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeDisabled();
  });

  test('submit button is disabled with short password', async ({ page }) => {
    await page.getByPlaceholder('What should we call you?').fill('Test User');
    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByPlaceholder('Create a password').fill('12345');

    await expect(page.getByRole('button', { name: 'Create Account' })).toBeDisabled();
  });

  test('submit button enables when form is valid', async ({ page }) => {
    await page.getByPlaceholder('What should we call you?').fill('Test User');
    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByPlaceholder('Create a password').fill('123456');

    await expect(page.getByRole('button', { name: 'Create Account' })).toBeEnabled();

    await page.screenshot({ path: 'test-results/signup-form-filled.png', fullPage: true });
  });

  test('sign in link navigates to login page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/m\/login/);
  });

  test('form fields accept input correctly', async ({ page }) => {
    const nameInput = page.getByPlaceholder('What should we call you?');
    const emailInput = page.getByPlaceholder('your@email.com');
    const passwordInput = page.getByPlaceholder('Create a password');

    await nameInput.fill('Jane Doe');
    await expect(nameInput).toHaveValue('Jane Doe');

    await emailInput.fill('jane@example.com');
    await expect(emailInput).toHaveValue('jane@example.com');

    await passwordInput.fill('securepass');
    await expect(passwordInput).toHaveValue('securepass');
  });

  test('mobile viewport renders properly', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);

    await page.screenshot({ path: 'test-results/signup-mobile-viewport.png', fullPage: true });
  });
});
