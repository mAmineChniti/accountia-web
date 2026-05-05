import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const { storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3000/en/login', {
      waitUntil: 'networkidle',
    });

    // Fill credentials
    await page.locator('#email').fill('hibakhadraoui2003@gmail.com');
    await page.locator('#password').fill('hiba123456789');

    console.log('🔑 Submitting login form...');
    await page.getByRole('button', { name: /Sign In/i }).click();

    console.log('⏳ Waiting for authentication result...');

    // Race between success (redirect), error, or 2FA
    const result = await Promise.race([
      page
        .waitForURL(/.*invoices|.*dashboard|.*profile|.*\/en\/$/, {
          timeout: 45000,
        })
        .then(() => 'success'),
      page
        .waitForSelector('#login-error', { timeout: 45000 })
        .then(() => 'error'),
      page
        .waitForSelector('text=/Two-Factor/i', { timeout: 45000 })
        .then(() => '2fa'),
    ]);

    if (result === 'error') {
      const errorMsg = await page.locator('#login-error').textContent();
      console.error('❌ Login failed with error:', errorMsg?.trim());
      await page.screenshot({ path: 'e2e-login-error.png' });
      throw new Error(`Login failed: ${errorMsg}`);
    }

    if (result === '2fa') {
      console.log(
        '🔒 2FA Required. Please configure a non-2FA test user for fully automated runs.'
      );
      // For now, we proceed to save whatever state we have
    }

    console.log('✅ Logged in successfully. Final URL:', page.url());

    // Ensure the auth directory exists
    const authDir = path.dirname(storageState as string);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save storage state for all tests to use
    await page.context().storageState({ path: storageState as string });
    console.log('💾 Auth state saved to', storageState);
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
