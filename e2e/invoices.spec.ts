import { test, expect } from '@playwright/test';

// No beforeEach needed - storageState from playwright.config.ts injects the
// pre-authenticated session (saved by global-setup.ts) into all browsers.

test.describe('Invoices Page', () => {
  test('should see the invoices list when logged in', async ({ page }) => {
    await page.goto('/en/invoices', { waitUntil: 'load' });

    // Heading rendered by the invoices page
    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test('should have a create business button', async ({ page }) => {
    await page.goto('/en/invoices', { waitUntil: 'load' });

    // Button text from dictionaries/en.json: "createBusinessButton": "Create a New Business"
    const createButton = page.getByText(/Create a New Business/i);
    await expect(createButton).toBeVisible({ timeout: 10000 });
  });
});
