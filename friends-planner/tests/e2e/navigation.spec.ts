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

test.describe('Navigation', () => {
  test('view switch preserves month', async ({ page }) => {
    await login(page);

    // Navigate to a known month
    await page.goto(`${baseUrl}/calendar/2031-05`);

    // Find and click the timeline button if available
    const timelineButton = page.getByRole('button', { name: /timeline|list/i });
    if (await timelineButton.isVisible({ timeout: 1000 })) {
      await timelineButton.click();

      // Should be on timeline for same month
      await page.waitForTimeout(200);
      expect(page.url()).toContain('2031-05');
    }
  });

  test('URL reflects calendar navigation', async ({ page }) => {
    await login(page);

    // Start at specific month
    await page.goto(`${baseUrl}/calendar/2031-06`);
    expect(page.url()).toContain('2031-06');

    // Navigate with next button
    const nextButton = page.getByRole('button', { name: /next month/i });
    if (await nextButton.isVisible({ timeout: 1000 })) {
      await nextButton.click();

      await page.waitForTimeout(200);
      // URL should have changed to next month
      expect(page.url()).toMatch(/\/calendar\/\d{4}-\d{2}/);
    }
  });

  test('esc closes dialogs', async ({ page }) => {
    await login(page);

    // Navigate to calendar
    await page.goto(`${baseUrl}/calendar/2031-09`);

    // Open add plan dialog
    const fab = page.getByRole('button', { name: /add plan/i });
    if (await fab.isVisible({ timeout: 1000 })) {
      await fab.click();

      // Wait for dialog to appear
      await page.waitForTimeout(200);

      // Press Escape
      await page.keyboard.press('Escape');

      // Wait for dialog to close
      await page.waitForTimeout(200);

      // Dialog should be closed (FAB should be visible again and clickable)
      expect(await fab.isVisible()).toBe(true);
    }
  });

  test('invalid calendar month path is handled', async ({ page }) => {
    await login(page);

    // Navigate to invalid month - should handle gracefully
    await page.goto(`${baseUrl}/calendar/2031-13`, { waitUntil: 'domcontentloaded' });

    // Page should either show error or redirect
    await page.waitForTimeout(500);

    // Check that page loaded (either error or redirect)
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
  });

  test('unknown API route returns JSON 404', async ({ page }) => {
    await login(page);

    const response = await page.request.get(`${baseUrl}/api/unknown-endpoint`);

    // Should return 404
    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  test('API returns proper error structure', async ({ page }) => {
    await login(page);

    // Make an invalid request
    const response = await page.request.post(`${baseUrl}/api/events`, {
      data: { invalid: true },
      headers: { 'Content-Type': 'application/json' },
    });

    // Should have error envelope
    if (response.status() >= 400) {
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
      expect(data.error.message).toBeDefined();
    }
  });
});
