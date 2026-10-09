import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import type { Page } from '@playwright/test';

const baseUrl = 'http://localhost:8888';
const groupPasscode = 'change-me-group';
const adminPasscode = 'change-me-admin-passcode';

async function login(page: Page) {
  await page.goto(baseUrl);
  const input = page.getByLabel('Group passcode');
  await input.fill(groupPasscode);
  const submitButton = page.getByRole('button', { name: /open calendar/i });
  await submitButton.click();
  await expect(page).toHaveURL(/\/calendar\//);
}

test.describe('Admin functionality', () => {
  test.afterEach(async ({}, testInfo) => {
    // Reset throttle state after each test to prevent lockouts from affecting subsequent tests
    if (testInfo.title.includes('wrong admin passcode')) {
      try {
        execSync(`npm run seed -- --base-url ${baseUrl}`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      } catch (error) {
        console.error('Failed to reset state after wrong admin passcode test:', error);
      }
    }
  });

  test('wrong admin passcode shows error', async ({ page }) => {
    await login(page);

    await page.goto(`${baseUrl}/admin`);

    const input = page.getByLabel('Admin passcode');
    await input.fill('wrong-passcode');

    const submitButton = page.getByRole('button', { name: /enter|continue/i });
    await submitButton.click();

    // Should show error
    const error = page.getByText(/passcode|incorrect|wrong/i);
    await expect(error).toBeVisible({ timeout: 3000 });
  });

  test('correct admin passcode grants access', async ({ page }) => {
    await login(page);

    await page.goto(`${baseUrl}/admin`);

    const input = page.getByLabel('Admin passcode');
    await input.fill(adminPasscode);

    const submitButton = page.getByRole('button', { name: /enter|continue/i });
    await submitButton.click();

    // Should show admin page with admin banner
    await expect(page).toHaveURL('/admin', { timeout: 3000 });

    const adminBanner = page.locator('[data-testid="admin-banner"]');
    await expect(adminBanner).toBeVisible({ timeout: 2000 });
  });

  test('admin can exit admin mode', async ({ page }) => {
    await login(page);

    // Go to admin page
    await page.goto(`${baseUrl}/admin`);

    const input = page.getByLabel('Admin passcode');
    await input.fill(adminPasscode);

    const submitButton = page.getByRole('button', { name: /enter|continue/i });
    await submitButton.click();

    await expect(page).toHaveURL('/admin', { timeout: 3000 });

    // Exit admin mode via menu
    const menuButton = page.getByRole('button', { name: /menu|exit|logout/i });
    if (await menuButton.isVisible({ timeout: 1000 })) {
      await menuButton.click();

      const exitButton = page.getByText(/exit|logout/i);
      if (await exitButton.isVisible({ timeout: 1000 })) {
        await exitButton.click();
      }
    }

    // Should go back to calendar
    await page.waitForTimeout(200);
    const url = page.url();
    expect(url).toContain('calendar');
  });
});
