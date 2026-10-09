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

test.describe('Permissions', () => {
  test('direct API call without session is rejected', async ({ page }) => {
    // Test that API requires authentication

    const response = await page.request.get(`${baseUrl}/api/events`, {
      headers: {
        // No session cookie
      },
    });

    // Should be 401 or require a session
    expect([401, 404]).toContain(response.status());
  });

  test('API requires group session for event access', async ({ page }) => {
    await login(page);

    // Get cookies
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'fp_session');

    if (sessionCookie) {
      // Try to access events with session - should work
      const response = await page.request.get(`${baseUrl}/api/events`, {
        headers: {
          Cookie: `fp_session=${sessionCookie.value}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.events).toBeDefined();
    }
  });

  test('wrong content type for mutation is rejected', async ({ page }) => {
    await login(page);

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === 'fp_session');

    if (sessionCookie) {
      // Try to POST without application/json content type
      const response = await page.request.post(`${baseUrl}/api/events`, {
        headers: {
          Cookie: `fp_session=${sessionCookie.value}`,
          'Content-Type': 'text/plain', // Wrong content type
        },
        data: 'invalid',
      });

      // Should reject with 415 or similar
      expect([400, 415]).toContain(response.status());
    }
  });
});
