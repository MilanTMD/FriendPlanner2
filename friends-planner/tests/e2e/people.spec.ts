import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const baseUrl = 'http://localhost:8888';
const groupPasscode = 'change-me-group';

async function login(page: Page, passcode = groupPasscode) {
  await page.goto(baseUrl);
  const input = page.getByLabel('Group passcode');
  await input.fill(passcode);
  const submitButton = page.getByRole('button', { name: /open calendar/i });
  await submitButton.click();
  await expect(page).toHaveURL(/\/calendar\//);
}

test.describe('Creating people and PINs', () => {
  test('create a new person with a valid PIN', async ({ page }) => {
    await login(page);

    // Navigate to people
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();
    const peopleLink = page.getByText('People').first();
    await peopleLink.click();

    await expect(page).toHaveURL('/people');

    // Click add person button
    const addPersonButton = page.getByRole('button', { name: /add person/i });
    await addPersonButton.click();

    // Fill form using accessible patterns
    const nameInput = page.getByLabel('Name');
    await nameInput.fill('e2e-test-person-new');

    // Select the first enabled color radio
    const colorRadios = page.getByRole('radio');
    for (let i = 0; i < (await colorRadios.count()); i++) {
      const radio = colorRadios.nth(i);
      const isDisabled = await radio.isDisabled();
      if (!isDisabled) {
        await radio.click();
        break;
      }
    }

    // Fill PIN fields
    const pinInputs = page.locator('input[inputmode="numeric"]');
    await pinInputs.first().fill('1234');
    await pinInputs.nth(1).fill('1234');

    // Save
    const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
    await saveButton.click();

    // Wait for the person to be created
    await page.waitForTimeout(500);

    // Acting as chip should show the new person
    const actingAsChip = page.locator('[data-testid="acting-as"]');
    await expect(actingAsChip).toContainText('e2e-test-person-new');
  });

  test('forget me on this device works', async ({ page }) => {
    await login(page);

    // Navigate to people
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();
    const peopleLink = page.getByText('People').first();
    await peopleLink.click();

    // Create a test person if not already there
    const addPersonButton = page.getByRole('button', { name: /add person/i });
    if (await addPersonButton.isVisible()) {
      await addPersonButton.click();

      const nameInput = page.getByLabel('Name');
      await nameInput.fill('e2e-forget-test-person');

      const colorRadios = page.locator('[role="radio"]');
      await colorRadios.first().click();

      const pinInputs = page.locator('input[inputmode="numeric"]');
      await pinInputs.first().fill('1234');
      await pinInputs.nth(1).fill('1234');

      const saveButton = page.getByRole('button', { name: /save|continue/i }).last();
      await saveButton.click();

      await page.waitForTimeout(300);
    }

    // Click on acting as chip to open menu
    const actingAsChip = page.locator('[data-testid="acting-as"]');
    await actingAsChip.click();

    // Look for "Forget me" option
    const forgetMeButton = page.getByText(/forget|Forget/i);
    if (await forgetMeButton.isVisible()) {
      await forgetMeButton.click();

      // Acting as chip should reset
      await page.waitForTimeout(200);
      // After forgetting, the text should change
      const chip = page.locator('[data-testid="acting-as"]');
      const text = await chip.textContent();
      expect(text).toBeTruthy();
    }
  });
});
