import { test, expect } from '@playwright/test';

// No beforeEach needed - storageState from playwright.config.ts injects the
// pre-authenticated session (saved by global-setup.ts) into all browsers.

test.describe('User Profile', () => {
  test('should display profile information', async ({ page }) => {
    await page.goto('/en/profile', { waitUntil: 'load' });

    // Vérifier si on est bien sur l'onglet Overview
    await page.getByRole('tab', { name: /Overview/i }).click();

    // Vérifier la présence des informations de base
    await expect(page.getByText(/Personal Information/i)).toBeVisible();
  });
});
