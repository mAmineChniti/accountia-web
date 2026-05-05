import { test, expect } from '@playwright/test';

// No beforeEach needed - storageState from playwright.config.ts injects the
// pre-authenticated session (saved by global-setup.ts) into all browsers.

test.describe('Business Management', () => {
  test('should navigate to business application form from invoices', async ({
    page,
  }) => {
    await page.goto('/en/invoices', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: /Invoices/i })).toBeVisible({
      timeout: 15000,
    });

    // Click "Create a New Business" button
    const createButton = page.getByText('Create a New Business');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    await expect(page).toHaveURL(/.*business-application/);

    // CardTitle renders as a <div>, NOT a heading ARIA role.
    // Use getByText instead of getByRole('heading').
    await expect(
      page.getByText(/Apply for Business Access|Demande d'accès/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should fill the business application form', async ({ page }) => {
    await page.goto('/en/business-application', { waitUntil: 'load' });
    await expect(page.getByLabel(/Business Name/i)).toBeVisible({
      timeout: 15000,
    });

    await page.getByLabel(/Business Name/i).fill('My Super Business');
    await page.getByLabel(/Business Email/i).fill('contact@superbiz.com');
    await page.getByLabel(/Description/i).fill('We do awesome things with AI');

    // Verify the submit button is present and enabled
    await expect(
      page.getByRole('button', { name: /Submit Application|Soumettre/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
