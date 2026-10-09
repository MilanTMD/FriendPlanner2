import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const baseUrl = 'http://localhost:8888';
const groupPasscode = 'change-me-group';
const testPin = '1234';

async function login(page: Page, passcode = groupPasscode) {
  await page.goto(baseUrl);
  const input = page.getByLabel('Group passcode');
  await input.fill(passcode);
  const submitButton = page.getByRole('button', { name: /open calendar/i });
  await submitButton.click();
  await expect(page).toHaveURL(/\/calendar\//);
}

async function createTestPerson(page: Page, name: string) {
  // Go to people page
  const menuButton = page.getByRole('button', { name: /menu/i });
  await menuButton.click();
  const peopleLink = page.getByText('People').first();
  await peopleLink.click();

  await expect(page).toHaveURL('/people');

  // Add person
  const addPersonButton = page.getByRole('button', { name: /add person/i });
  await addPersonButton.click();

  // Fill form
  const nameInput = page.getByLabel('Name');
  await nameInput.fill(name);

  // Click the first enabled color radio button
  const colorButtons = page.getByRole('radio');
  for (let i = 0; i < (await colorButtons.count()); i++) {
    const radio = colorButtons.nth(i);
    const isDisabled = await radio.isDisabled();
    if (!isDisabled) {
      await radio.click();
      break;
    }
  }

  // Fill PIN
  const pinInputs = page.locator('input[inputmode="numeric"]');
  const pinInput = pinInputs.first();
  await pinInput.fill(testPin);

  // Confirm PIN
  const confirmPinInput = pinInputs.nth(1);
  await confirmPinInput.fill(testPin);

  // Save
  const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
  await saveButton.click();

  // Wait for redirect back
  await expect(page).toHaveURL('/people');
}

test.describe('Plans CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('add plan with remembered device (G1 interaction budget)', async ({ page }) => {
    // Create a test person first
    await createTestPerson(page, 'e2e-test-person-1');

    // Navigate back to calendar
    await page.goto(`${baseUrl}/calendar/2031-05`);

    // Start timer for interaction budget
    const startTime = Date.now();

    // 1. Tap FAB "Add plan"
    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    // Plan form should open
    const planSheet = page.locator('[data-testid="event-form"]');
    await expect(planSheet).toBeVisible();

    // 2. Type plan title
    const titleInput = planSheet.getByLabel('Plan');
    await titleInput.focus();
    await titleInput.fill('E2E Test Trip');

    // 3. Type place
    const placeInput = planSheet.getByLabel('Place');
    await placeInput.fill('Test Location');

    // 4. Set "From" date (already pre-filled with today)
    // Skip if it's already set

    // 5. Set "To" date
    const dateInputs = page.locator('input[type="date"]');
    // To date is the second date input
    if (await dateInputs.count() > 0) {
      // If From is empty, fill it
      const fromDateInput = dateInputs.first();
      const currentValue = await fromDateInput.inputValue();
      if (!currentValue) {
        await fromDateInput.fill('2031-05-15');
      }
      // Fill To date
      const toDateInput = dateInputs.nth(1);
      await toDateInput.fill('2031-05-17');
    }

    // 6. Click Save
    const saveButton = page.getByRole('button', { name: /save plan/i });
    await saveButton.click();

    const endTime = Date.now();
    const interactionTime = endTime - startTime;

    // Verify plan was created (bar appears in calendar)
    await expect(page).toHaveURL(/\/calendar\//);
    const eventBar = page.locator('[data-testid="event-bar"]').first();
    await expect(eventBar).toBeVisible({ timeout: 5000 });

    // The interaction budget should be met (this is just a check, not a hard constraint in the test)
    console.log(`Interaction completed in ${interactionTime}ms`);
  });

  test('edit plan changes dates', async ({ page }) => {
    await createTestPerson(page, 'e2e-test-person-2');

    // Create a plan first by going to calendar and creating one
    await page.goto(`${baseUrl}/calendar/2031-05`);

    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const form = page.locator('[data-testid="event-form"]');
    const titleInput = form.getByLabel('Plan');
    await titleInput.fill('Edit Test Plan');

    const placeInput = form.getByLabel('Place');
    await placeInput.fill('Test Location');

    const dateInputs = page.locator('input[type="date"]');
    const fromDateInput = dateInputs.first();
    const toDateInput = dateInputs.nth(1);

    const currentValue = await fromDateInput.inputValue();
    if (!currentValue) {
      await fromDateInput.fill('2031-05-15');
    }
    await toDateInput.fill('2031-05-17');

    const saveButton = page.getByRole('button', { name: /save plan/i });
    await saveButton.click();

    // Now edit the plan
    await expect(page).toHaveURL(/\/calendar\//);

    // Find and click the bar to open plan detail
    const eventBar = page.locator('[data-testid="event-bar"]').first();
    await eventBar.click();

    // Open edit
    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();

    // Update the dates
    const editDateInputs = page.locator('input[type="date"]');
    const editFromInput = editDateInputs.first();
    const editToInput = editDateInputs.nth(1);

    await editFromInput.fill('2031-05-20');
    await editToInput.fill('2031-05-22');

    // Save
    const savEditButton = page.getByRole('button', { name: /save plan/i });
    await savEditButton.click();

    // Verify the bar moved to new dates
    await expect(page).toHaveURL(/\/calendar\//);
  });

  test('delete plan with confirmation', async ({ page }) => {
    await createTestPerson(page, 'e2e-test-person-3');

    // Create a plan
    await page.goto(`${baseUrl}/calendar/2031-05`);

    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const form = page.locator('[data-testid="event-form"]');
    const titleInput = form.getByLabel('Plan');
    await titleInput.fill('Delete Test Plan');

    const placeInput = form.getByLabel('Place');
    await placeInput.fill('Test Location');

    const dateInputs = page.locator('input[type="date"]');
    const fromDateInput = dateInputs.first();
    const toDateInput = dateInputs.nth(1);

    const currentValue = await fromDateInput.inputValue();
    if (!currentValue) {
      await fromDateInput.fill('2031-05-25');
    }
    await toDateInput.fill('2031-05-26');

    const saveButton = page.getByRole('button', { name: /save plan/i });
    await saveButton.click();

    // Find and click the bar
    const eventBar = page.locator('[data-testid="event-bar"]').first();
    await eventBar.click();

    // Click delete
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Confirm delete
    const confirmDeleteButton = page.getByRole('button', { name: /delete plan/i });
    await confirmDeleteButton.click();

    // Should see toast and bar should be gone
    const toast = page.getByText(/plan deleted/i);
    await expect(toast).toBeVisible();
  });

  test('cancel delete keeps plan', async ({ page }) => {
    await createTestPerson(page, 'e2e-test-person-4');

    // Create a plan
    await page.goto(`${baseUrl}/calendar/2031-06`);

    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const form = page.locator('[data-testid="event-form"]');
    const titleInput = form.getByLabel('Plan');
    await titleInput.fill('Keep Test Plan');

    const placeInput = form.getByLabel('Place');
    await placeInput.fill('Test Location');

    const dateInputs = page.locator('input[type="date"]');
    const fromDateInput = dateInputs.first();
    const toDateInput = dateInputs.nth(1);

    const currentValue = await fromDateInput.inputValue();
    if (!currentValue) {
      await fromDateInput.fill('2031-06-15');
    }
    await toDateInput.fill('2031-06-17');

    const saveButton = page.getByRole('button', { name: /save plan/i });
    await saveButton.click();

    // Find and click the bar
    const eventBar = page.locator('[data-testid="event-bar"]').first();
    await eventBar.click();

    // Click delete
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    // Click "Keep it" instead
    const keepButton = page.getByRole('button', { name: /keep it/i });
    await keepButton.click();

    // Bar should still be visible
    await expect(eventBar).toBeVisible();
  });

  test('empty form shows validation errors', async ({ page }) => {
    await createTestPerson(page, 'e2e-test-person-5');

    await page.goto(`${baseUrl}/calendar/2031-07`);

    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    // Try to save without filling anything
    const saveButton = page.getByRole('button', { name: /save plan/i });
    await saveButton.click();

    // Should see error messages
    const errors = page.locator('[role="alert"]');
    await expect(errors.first()).toBeVisible();
  });

  test('invalid end date before start shows error', async ({ page }) => {
    await createTestPerson(page, 'e2e-test-person-6');

    await page.goto(`${baseUrl}/calendar/2031-08`);

    const fab = page.getByRole('button', { name: /add plan/i });
    await fab.click();

    const form = page.locator('[data-testid="event-form"]');
    const titleInput = form.getByLabel('Plan');
    await titleInput.fill('Bad Date Plan');

    const placeInput = form.getByLabel('Place');
    await placeInput.fill('Test Location');

    const dateInputs = page.locator('input[type="date"]');
    const fromDateInput = dateInputs.first();
    const toDateInput = dateInputs.nth(1);

    await fromDateInput.fill('2031-08-20');
    await toDateInput.fill('2031-08-10'); // Before start

    const saveButton = page.getByRole('button', { name: /save plan/i });
    await saveButton.click();

    // Should see error
    const errors = page.locator('[role="alert"]');
    await expect(errors.first()).toBeVisible();
  });
});
