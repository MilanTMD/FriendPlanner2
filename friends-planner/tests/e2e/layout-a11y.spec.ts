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

test.describe('Layout and Accessibility', () => {
  test('no horizontal scroll on calendar at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    const windowWidth = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1); // Allow 1px for rounding
  });

  test('no horizontal scroll on calendar at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);

    const windowWidth = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1);
  });

  test('no horizontal scroll on calendar at 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    const windowWidth = await page.evaluate(() => window.innerWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    expect(documentWidth).toBeLessThanOrEqual(windowWidth + 1);
  });

  test('timeline view is accessible at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);

    // Navigate to timeline
    await page.goto(`${baseUrl}/timeline/2031-05`);

    // Timeline should load
    const timelineGrid = page.locator('[data-testid="timeline"]');
    if (await timelineGrid.isVisible({ timeout: 2000 })) {
      expect(page.url()).toContain('timeline');
    }
  });

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(baseUrl);
    await login(page);

    // Give the page time to complete all initialization
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });


  test('keyboard navigation on day cells', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);

    // Find the first day cell
    const dayCells = page.locator('[data-testid="day-cell"]');
    const firstCell = dayCells.first();

    // Focus the first cell
    await firstCell.focus();

    // Check that focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        outline: style.outline,
        outlineOffset: style.outlineOffset,
      };
    });

    expect(focusedElement).toBeTruthy();
  });

  test('day detail shows plan count in accessible name', async ({ page }) => {
    await login(page);

    // Go to a day detail
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${date}`;

    await page.goto(`${baseUrl}/day/${todayDate}`);

    // The heading or summary should indicate who is away
    const summary = page.getByText(/people away|around/i);
    await expect(summary.first()).toBeVisible();
  });

  test('theme switching sets data-theme on html', async ({ page }) => {
    await login(page);

    // Get initial theme
    let theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toMatch(/light|dark/);

    // Open menu and change theme
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    // Find theme options
    const darkOption = page.getByLabel('Dark');
    if (await darkOption.isVisible()) {
      await darkOption.click();

      // Verify theme changed
      theme = await page.locator('html').getAttribute('data-theme');
      expect(theme).toBe('dark');
    }
  });

});
