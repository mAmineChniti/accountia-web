import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Check for validation messages
    await expect(
      page.getByText(/Invalid email/i).or(page.getByText(/Required/i))
    ).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByRole('link', { name: /Sign Up/i }).click();
    await expect(page).toHaveURL(/.*register/);
  });
});
