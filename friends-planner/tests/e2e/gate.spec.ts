import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

test.describe('Gate and passcode entry', () => {
  test.afterEach(async ({}, testInfo) => {
    // Reset throttle state after each test to prevent lockouts from affecting subsequent tests
    if (testInfo.title.includes('wrong passcode')) {
      try {
        const baseUrl = process.env.BASE_URL ?? 'http://localhost:8888';
        execSync(`npm run seed -- --base-url ${baseUrl}`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
      } catch (error) {
        console.error('Failed to reset state after wrong passcode test:', error);
      }
    }
  });

  test('wrong passcode shows error', async ({ page }) => {
    await page.goto('http://localhost:8888/');

    const input = page.getByLabel('Group passcode');
    await input.fill('wrong-passcode');

    const submitButton = page.getByRole('button', { name: /open calendar/i });
    await submitButton.click();

    // Wait for error message
    const error = page.getByText(/passcode didn't work/i);
    await expect(error).toBeVisible();
  });

  test('correct passcode opens the calendar', async ({ page }) => {
    await page.goto('http://localhost:8888/');

    const input = page.getByLabel('Group passcode');
    await input.fill('change-me-group');

    const submitButton = page.getByRole('button', { name: /open calendar/i });
    await submitButton.click();

    // Should redirect to calendar
    await expect(page).toHaveURL(/\/calendar\//);

    // Calendar should be visible
    const monthGrid = page.locator('[data-testid="month-grid"]');
    await expect(monthGrid).toBeVisible();
  });

  test('session persists after reload', async ({ page }) => {
    await page.goto('http://localhost:8888/');

    const input = page.getByLabel('Group passcode');
    await input.fill('change-me-group');

    const submitButton = page.getByRole('button', { name: /open calendar/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/calendar\//);

    // Reload the page
    await page.reload();

    // Should still be on calendar
    await expect(page).toHaveURL(/\/calendar\//);
    const monthGrid = page.locator('[data-testid="month-grid"]');
    await expect(monthGrid).toBeVisible();
  });

  test('deep link survives login', async ({ page }) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${date}`;

    await page.goto(`http://localhost:8888/day/${todayDate}`);

    // Should show gate
    const input = page.getByLabel('Group passcode');
    await expect(input).toBeVisible();

    // Login
    await input.fill('change-me-group');
    const submitButton = page.getByRole('button', { name: /open calendar/i });
    await submitButton.click();

    // Should go to the requested day detail, not the calendar
    await expect(page).toHaveURL(`/day/${todayDate}`);
  });

  test('lock calendar returns to gate', async ({ page }) => {
    await page.goto('http://localhost:8888/');

    const input = page.getByLabel('Group passcode');
    await input.fill('change-me-group');

    const submitButton = page.getByRole('button', { name: /open calendar/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/calendar\//);

    // Open menu and lock
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    const lockButton = page.getByText(/lock calendar/i);
    await lockButton.click();

    // Should show gate
    const gateInput = page.getByLabel('Group passcode');
    await expect(gateInput).toBeVisible();
  });
});
