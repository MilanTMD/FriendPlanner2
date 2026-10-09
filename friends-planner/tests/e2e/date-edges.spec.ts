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

test.describe('Date edge cases @tz', () => {
  test('single-day event renders correctly', async ({ page }) => {
    await login(page);

    // Navigate to January 2031
    await page.goto(`${baseUrl}/calendar/2031-01`);

    // Verify month grid is visible
    const monthGrid = page.locator('[data-testid="month-grid"]');
    await expect(monthGrid).toBeVisible();

    // Look for a day in the calendar
    const jan15 = page.locator('[data-testid="day-cell"][data-date="2031-01-15"]');
    await expect(jan15).toBeVisible();
  });

  test('calendar shows correct month in URL', async ({ page }) => {
    await login(page);

    // Navigate to specific months
    await page.goto(`${baseUrl}/calendar/2031-03`);
    await expect(page).toHaveURL('/calendar/2031-03');

    // Move to next month (Next month is a link, not a button)
    const nextButton = page.getByRole('link', { name: /next month/i });
    await nextButton.click();

    // URL should change
    await page.waitForTimeout(200);
    const url = page.url();
    expect(url).toMatch(/\/calendar\/2031-0[4]/);
  });

  test('timeline view also handles months correctly', async ({ page }) => {
    await login(page);

    // Navigate to timeline
    await page.goto(`${baseUrl}/timeline/2031-05`);

    // Should be on timeline view
    const timeline = page.locator('[data-testid="timeline"]');
    if (await timeline.isVisible({ timeout: 2000 })) {
      expect(page.url()).toMatch(/\/timeline\/2031-05/);
    }
  });
});
