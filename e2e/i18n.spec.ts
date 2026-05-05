import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should display English by default on /en/login', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByText(/Sign In/i)).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('should switch language from English to Arabic', async ({ page }) => {
    await page.goto('/en/login');

    // Click language switcher (Assuming it's a dropdown or button)
    // dictionary.common.language: "Language"
    await page.getByRole('button', { name: /Language|Langue/i }).click();

    // Click "Arabic" option
    await page.getByRole('menuitem', { name: /Arabic|العربية/i }).click();

    // Verify URL change
    await expect(page).toHaveURL(/.*\/ar\/login/);

    // The HTML element must have dir="rtl" and lang="ar"
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl', { timeout: 15000 });
    await expect(html).toHaveAttribute('lang', 'ar', { timeout: 15000 });
  });
});
