import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// This test file is tagged with @tz and runs in UTC+14 and UTC-11 projects
// It verifies that date handling is correct across timezones

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

async function createPerson(page: Page, name: string) {
  const menuButton = page.getByRole('button', { name: /menu/i });
  await menuButton.click();
  const peopleLink = page.getByText('People');
  await peopleLink.click();

  await expect(page).toHaveURL('/people');

  const addPersonButton = page.getByRole('button', { name: /add person/i });
  await addPersonButton.click();

  const nameInput = page.getByLabel('Name');
  await nameInput.fill(name);

  // Click the first enabled color radio button
  const colorRadios = page.getByRole('radio');
  for (let i = 0; i < (await colorRadios.count()); i++) {
    const radio = colorRadios.nth(i);
    const isDisabled = await radio.isDisabled();
    if (!isDisabled) {
      await radio.click();
      break;
    }
  }

  const pinInputs = page.locator('input[inputmode="numeric"]');
  await pinInputs.first().fill('1234');
  await pinInputs.nth(1).fill('1234');

  const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
  await saveButton.click();

  await expect(page).toHaveURL('/people');
}

test.describe('Timezone handling @tz', () => {
  test('single-day plan renders on correct date only', async ({ page }) => {
    await login(page);
    await createPerson(page, 'e2e-tz-person');

    // Navigate to a month with January 1st
    await page.goto(`${baseUrl}/calendar/2031-01`);

    // Create a single-day plan on Jan 1st
    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const form = page.locator('[data-testid="event-form"]');
    const titleInput = form.getByLabel('Plan');
    await titleInput.fill('TZ Test Single Day');

    const placeInput = form.getByLabel('Place');
    await placeInput.fill('TZ Test Place');

    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('2031-01-01');
      await dateInputs.nth(1).fill('2031-01-01'); // Same date for single-day
    }

    const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
    await saveButton.click();

    await page.waitForTimeout(300);

    // Verify it appears only on Jan 1st in the calendar
    const jan1Cell = page.locator('[data-testid="day-cell"][data-date="2031-01-01"]');
    await expect(jan1Cell).toBeVisible();

    const jan2Cell = page.locator('[data-testid="day-cell"][data-date="2031-01-02"]');
    const jan2EventBar = jan2Cell.locator('[data-testid="event-bar"]');
    // Jan 2 should not have this plan
    expect(await jan2EventBar.count()).toBe(0);

    // Verify in edit form it shows same date
    const eventBar = page.locator('[data-testid="event-bar"]').first();
    await eventBar.click();

    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Both date fields should show 2031-01-01
      const fromDateInput = page.locator('input[type="date"]').first();
      const toDateInput = page.locator('input[type="date"]').nth(1);

      const fromValue = await fromDateInput.inputValue();
      const toValue = await toDateInput.inputValue();

      expect(fromValue).toBe('2031-01-01');
      expect(toValue).toBe('2031-01-01');
    }
  });

  test('month-boundary plan renders correctly in both months', async ({ page }) => {
    await login(page);
    await createPerson(page, 'e2e-tz-boundary');

    // Navigate to January
    await page.goto(`${baseUrl}/calendar/2031-01`);

    // Create a plan crossing Jan 31 to Feb 1
    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const form = page.locator('[data-testid="event-form"]');
    const titleInput = form.getByLabel('Plan');
    await titleInput.fill('TZ Boundary Plan');

    const placeInput = form.getByLabel('Place');
    await placeInput.fill('TZ Place');

    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('2031-01-31');
      await dateInputs.nth(1).fill('2031-02-01');
    }

    const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
    await saveButton.click();

    await page.waitForTimeout(300);

    // Check in January calendar
    const jan31Cell = page.locator('[data-testid="day-cell"][data-date="2031-01-31"]');
    const jan31EventBar = jan31Cell.locator('[data-testid="event-bar"]');
    expect(await jan31EventBar.count()).toBeGreaterThan(0);

    // Navigate to February (Next month is a link, not a button)
    const nextButton = page.getByRole('link', { name: /next month/i });
    await nextButton.click();

    await page.waitForTimeout(300);

    // Check in February calendar
    const feb1Cell = page.locator('[data-testid="day-cell"][data-date="2031-02-01"]');
    const feb1EventBar = feb1Cell.locator('[data-testid="event-bar"]');
    expect(await feb1EventBar.count()).toBeGreaterThan(0);
  });

  test('today is correctly identified in local timezone', async ({ page }) => {
    // Use page.clock to set a fixed time
    // This test runs at a specific local time in the test timezone
    // "Today" must show the correct local date, not UTC date

    await page.clock.install({ time: new Date('2026-10-09T00:30:00').getTime() });

    await login(page);

    // Navigate to October 2026
    await page.goto(`${baseUrl}/calendar/2026-10`);

    // Compute the expected "today" date in the browser's local timezone
    const expectedTodayDate = await page.evaluate(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    // Look for the today button or check which day is marked as today
    const todayButton = page.getByRole('button', { name: /today/i });
    if (await todayButton.isVisible()) {
      await todayButton.click();
      // Should navigate to today
      await expect(page).toHaveURL(/\/calendar\/2026-10/);
    }

    // Find the day cell marked as today
    const todayCell = page.locator('[data-testid="day-cell"][data-today="true"]');
    const todayDate = await todayCell.getAttribute('data-date');

    // The date should match what the browser computed as "today" in its local timezone
    expect(todayDate).toBe(expectedTodayDate);
  });

  test('API returns YYYY-MM-DD format correctly', async ({ page }) => {
    await login(page);
    await createPerson(page, 'e2e-tz-api');

    // Navigate to a month
    await page.goto(`${baseUrl}/calendar/2031-03`);

    // Create a plan
    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const titleInput = page.locator('input[placeholder*="e.g."]').or(page.locator('input[type="text"]')).first();
    await titleInput.fill('API Format Test');

    const placeInput = page.locator('input[placeholder*="e.g."]').or(page.locator('input[type="text"]')).nth(1);
    await placeInput.fill('API Place');

    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('2031-03-15');
      await dateInputs.nth(1).fill('2031-03-17');
    }

    const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
    await saveButton.click();

    await page.waitForTimeout(300);

    // Fetch the events via API
    const response = await page.request.get(`${baseUrl}/api/events?from=2031-03-15&to=2031-03-17`);
    const data = await response.json();

    expect(response.status()).toBe(200);
    expect(data.events).toBeDefined();

    interface PlanEventData {
      title: string;
      startDate: string;
      endDate: string;
    }
    const event = (data.events as PlanEventData[]).find((e) => e.title === 'API Format Test');
    if (event) {
      // Dates should be in YYYY-MM-DD format exactly
      expect(event.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(event.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      expect(event.startDate).toBe('2031-03-15');
      expect(event.endDate).toBe('2031-03-17');
    }
  });
});
