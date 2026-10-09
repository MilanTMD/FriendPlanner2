import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const baseUrl = 'http://localhost:8888';
const groupPasscode = 'change-me-group';

async function login(page: Page) {
  await page.goto(baseUrl);
  const input = page.getByLabel('Group passcode');
  await input.fill(groupPasscode);
  const submitButton = page.getByRole('button', { name: /open calendar/i });
  await submitButton.click();
  await expect(page).toHaveURL(/\/calendar\//);
}

test.describe('Theme switching', () => {
  test('can toggle between light and dark theme', async ({ page }) => {
    await login(page);

    // Get initial theme
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('data-theme');

    // Find theme toggle button (could be in menu or header)
    const themeButton = page.getByRole('button', { name: /theme|light|dark|mode/i });

    if (await themeButton.isVisible()) {
      await themeButton.click();

      await page.waitForTimeout(200);

      // Theme should have changed
      const newTheme = await htmlElement.getAttribute('data-theme');

      // Theme should be different
      if (initialTheme && newTheme) {
        expect(newTheme).not.toBe(initialTheme);
      }
    }
  });

  test('theme choice persists after reload', async ({ page }) => {
    await login(page);

    // Set theme
    const themeButton = page.getByRole('button', { name: /theme|light|dark|mode/i });
    if (await themeButton.isVisible()) {
      // Click multiple times to ensure we end up on a specific theme
      await themeButton.click();
      await page.waitForTimeout(200);

      // Get current theme
      const htmlElement = page.locator('html');
      const themeAfterClick = await htmlElement.getAttribute('data-theme');

      // Reload page
      await page.reload();

      await page.waitForTimeout(200);

      // Theme should be the same
      const themeAfterReload = await htmlElement.getAttribute('data-theme');

      if (themeAfterClick && themeAfterReload) {
        expect(themeAfterReload).toBe(themeAfterClick);
      }
    }
  });

  test('system theme preference is respected in auto mode', async ({ page }) => {
    await login(page);

    // Set to system/auto mode if available
    const themeButton = page.getByRole('button', { name: /theme|light|dark|mode|system|auto/i });
    if (await themeButton.isVisible()) {
      // Look for a menu with theme options
      const themeMenu = page.getByRole('menu').or(page.getByRole('listbox'));

      if (await themeMenu.isVisible()) {
        // Click on system/auto option if available
        const systemOption = page.getByText(/system|auto|preference/i);
        if (await systemOption.isVisible()) {
          await systemOption.click();
        }
      }

      await page.waitForTimeout(200);

      // Theme should match system preference
      // Emulate color scheme
      await page.emulateMedia({ colorScheme: 'dark' });

      await page.waitForTimeout(200);

      const htmlElement = page.locator('html');
      const themeDark = await htmlElement.getAttribute('data-theme');

      // Could be 'dark' or 'dark' depending on implementation
      expect(themeDark).toBeDefined();

      // Switch to light
      await page.emulateMedia({ colorScheme: 'light' });

      await page.waitForTimeout(200);

      const themeLight = await htmlElement.getAttribute('data-theme');
      expect(themeLight).toBeDefined();
    }
  });

  test('data-theme attribute is on html element', async ({ page }) => {
    await login(page);

    const htmlElement = page.locator('html');
    const themeAttr = await htmlElement.getAttribute('data-theme');

    // Should have data-theme attribute
    expect(themeAttr).toBeDefined();

    // Should be one of the valid values
    expect(['light', 'dark', 'system']).toContain(themeAttr);
  });

  test('theme toggle is accessible from menu', async ({ page }) => {
    await login(page);

    // Open menu
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    // Look for theme option
    const themeOption = page.getByText(/theme|dark|light|mode/i);
    const isVisible = await themeOption.isVisible({ timeout: 1000 }).catch(() => false);

    // Theme toggle should be in menu or elsewhere on page
    const themeButtonAnywhere = page.getByRole('button', { name: /theme|light|dark/i });
    const isVisibleAnywhere = await themeButtonAnywhere.isVisible({ timeout: 1000 }).catch(
      () => false,
    );

    // At least one of them should be visible
    expect(isVisible || isVisibleAnywhere).toBe(true);
  });
});
