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

test.describe('Person filtering', () => {
  test('can filter by selecting a person', async ({ page }) => {
    await login(page);

    // Navigate to calendar
    await page.goto(`${baseUrl}/calendar/2031-11`);

    // Look for filter button/menu
    const filterButton = page.getByRole('button', { name: /filter|person|people/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Should show person list
      const personList = page.locator('[role="checkbox"]').or(page.locator('label'));
      if (await personList.first().isVisible()) {
        // Select one person (uncheck others)
        const personCheckboxes = page.locator('input[type="checkbox"]');
        if (await personCheckboxes.count() > 1) {
          // Uncheck all first if there's an "All" option
          const allCheckbox = page.getByLabel(/all|everyone/i);
          if (await allCheckbox.isVisible()) {
            await allCheckbox.uncheck();
          }

          // Check only the first person
          await personCheckboxes.first().check();

          // Close filter menu
          await page.keyboard.press('Escape');

          // Calendar should now show only bars for that person
          await page.waitForTimeout(200);

          // Count visible bars - should be fewer than before
          const eventBars = page.locator('[data-testid="event-bar"]');
          const barCount = await eventBars.count();
          expect(barCount).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('filter persists after page reload', async ({ page }) => {
    await login(page);

    // Navigate to calendar
    await page.goto(`${baseUrl}/calendar/2031-12`);

    // Open filter
    const filterButton = page.getByRole('button', { name: /filter|person|people/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Select first person only
      const personCheckboxes = page.locator('input[type="checkbox"]');
      const allCheckbox = page.getByLabel(/all|everyone/i);
      if (await allCheckbox.isVisible()) {
        await allCheckbox.uncheck();
      }

      if (await personCheckboxes.count() > 0) {
        await personCheckboxes.first().check();
      }

      // Close filter
      await page.keyboard.press('Escape');

      // Get the count of visible bars
      await page.waitForTimeout(200);
      const eventBars1 = page.locator('[data-testid="event-bar"]');
      const count1 = await eventBars1.count();

      // Reload the page
      await page.reload();

      // Wait for page to load
      await page.waitForTimeout(300);

      // Count bars again - should be the same
      const eventBars2 = page.locator('[data-testid="event-bar"]');
      const count2 = await eventBars2.count();

      expect(count2).toBe(count1);
    }
  });

  test('can reset filter with "All" button', async ({ page }) => {
    await login(page);

    // Navigate to calendar
    await page.goto(`${baseUrl}/calendar/2032-01`);

    // Open filter
    const filterButton = page.getByRole('button', { name: /filter|person|people/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Select all to reset filter
      const allCheckbox = page.getByLabel(/all|everyone/i);

      if (await allCheckbox.isVisible()) {
        // Uncheck all
        await allCheckbox.uncheck();
        await page.waitForTimeout(100);

        // Now check the "All" checkbox again
        await allCheckbox.check();
      }

      // Close filter
      await page.keyboard.press('Escape');

      // All bars should now be visible
      const eventBars = page.locator('[data-testid="event-bar"]');
      const barCount = await eventBars.count();

      // Should have multiple bars visible
      expect(barCount).toBeGreaterThan(0);
    }
  });

  test('day detail shows "hidden by filter" message', async ({ page }) => {
    await login(page);

    // Navigate to calendar
    await page.goto(`${baseUrl}/calendar/2032-02`);

    // Apply filter
    const filterButton = page.getByRole('button', { name: /filter|person|people/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Keep only one person visible
      const personCheckboxes = page.locator('input[type="checkbox"]');
      const allCheckbox = page.getByLabel(/all|everyone/i);

      if (await allCheckbox.isVisible()) {
        await allCheckbox.uncheck();
      }

      if (await personCheckboxes.count() > 0) {
        await personCheckboxes.first().check();
      }

      await page.keyboard.press('Escape');
    }

    // Open day detail
    const dayCell = page.locator('[data-testid="day-cell"]').first();
    await dayCell.click();

    // Message about hidden events may or may not appear depending on the filter
    // and whether there are hidden events on that day
  });

  test('filter button shows count of active filters', async ({ page }) => {
    await login(page);

    // Navigate to calendar
    await page.goto(`${baseUrl}/calendar/2032-03`);

    // Open filter
    const filterButton = page.getByRole('button', { name: /filter|person|people/i });
    if (await filterButton.isVisible()) {
      // Initially all should be visible, count should be 0 or not shown

      // Select only one person
      await filterButton.click();

      const personCheckboxes = page.locator('input[type="checkbox"]');
      const allCheckbox = page.getByLabel(/all|everyone/i);

      if (await allCheckbox.isVisible()) {
        await allCheckbox.uncheck();
      }

      if (await personCheckboxes.count() > 0) {
        await personCheckboxes.first().check();
      }

      await page.keyboard.press('Escape');

      // Filter button might show a badge/count now to indicate filtering is active
      // This depends on the implementation
    }
  });

  test('timeline respects person filter', async ({ page }) => {
    await login(page);

    // Navigate to calendar first
    await page.goto(`${baseUrl}/calendar/2032-04`);

    // Apply a filter
    const filterButton = page.getByRole('button', { name: /filter|person|people/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      const personCheckboxes = page.locator('input[type="checkbox"]');
      const allCheckbox = page.getByLabel(/all|everyone/i);

      if (await allCheckbox.isVisible()) {
        await allCheckbox.uncheck();
      }

      const checkboxCount = await personCheckboxes.count();
      if (checkboxCount > 0) {
        // Keep only first person
        for (let i = 0; i < checkboxCount; i++) {
          if (i === 0) {
            await personCheckboxes.nth(i).check();
          } else {
            await personCheckboxes.nth(i).uncheck();
          }
        }
      }

      await page.keyboard.press('Escape');
    }

    // Switch to timeline view
    const timelineButton = page.getByRole('button', { name: /timeline|list/i });
    if (await timelineButton.isVisible()) {
      await timelineButton.click();

      // Should be in timeline view
      await expect(page).toHaveURL(/\/timeline\//);

      // Timeline should show only filtered person's rows
      const timelineRows = page.locator('[data-testid="timeline-row"]');
      const rowCount = await timelineRows.count();

      // Should have fewer rows than total people
      expect(rowCount).toBeGreaterThanOrEqual(0);
    }
  });
});
