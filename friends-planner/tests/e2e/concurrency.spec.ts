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

test.describe('Concurrency and parallel operations', () => {
  test('multiple reads during normal operations', async ({ page }) => {
    await login(page);

    // Perform multiple concurrent API reads
    const readResponses = await Promise.all([
      page.request.get(`${baseUrl}/api/events?from=2031-05-01&to=2031-05-31`),
      page.request.get(`${baseUrl}/api/events?from=2031-05-01&to=2031-05-31`),
      page.request.get(`${baseUrl}/api/events?from=2031-05-01&to=2031-05-31`),
      page.request.get(`${baseUrl}/api/events?from=2031-05-01&to=2031-05-31`),
    ]);

    // All should succeed
    for (const response of readResponses) {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
    }
  });

  test('concurrent writes handle conflicts gracefully', async ({ page }) => {
    await login(page);

    // Get people and try to fetch events
    const response = await page.request.get(`${baseUrl}/api/people`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    if (data.people && data.people.length > 0) {
      const personId = data.people[0].id;

      // Try 4 concurrent event creations for the same person
      const createResponses = await Promise.all([
        page.request.post(`${baseUrl}/api/events`, {
          data: {
            personId,
            title: `Concurrent Event 1`,
            place: 'Place 1',
            startDate: '2032-05-10',
            endDate: '2032-05-12',
            notes: '',
          },
          headers: { 'Content-Type': 'application/json' },
        }),
        page.request.post(`${baseUrl}/api/events`, {
          data: {
            personId,
            title: `Concurrent Event 2`,
            place: 'Place 2',
            startDate: '2032-05-10',
            endDate: '2032-05-12',
            notes: '',
          },
          headers: { 'Content-Type': 'application/json' },
        }),
        page.request.post(`${baseUrl}/api/events`, {
          data: {
            personId,
            title: `Concurrent Event 3`,
            place: 'Place 3',
            startDate: '2032-05-10',
            endDate: '2032-05-12',
            notes: '',
          },
          headers: { 'Content-Type': 'application/json' },
        }),
        page.request.post(`${baseUrl}/api/events`, {
          data: {
            personId,
            title: `Concurrent Event 4`,
            place: 'Place 4',
            startDate: '2032-05-10',
            endDate: '2032-05-12',
            notes: '',
          },
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      // At least some should succeed
      const successCount = createResponses.filter((r) => r.status() === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // All responses should be valid (no 500 errors)
      for (const response of createResponses) {
        expect([201, 400, 403, 404]).toContain(response.status());
      }
    }
  });

  test('reads do not lose updates', async ({ page }) => {
    await login(page);

    // Perform concurrent read and verify data consistency
    const responses = await Promise.all([
      page.request.get(`${baseUrl}/api/people`),
      page.request.get(`${baseUrl}/api/people`),
      page.request.get(`${baseUrl}/api/people`),
    ]);

    // All responses should return the same data
    const dataSets = await Promise.all(responses.map((r) => r.json()));

    if (dataSets.length > 1) {
      // All should have the same people count
      const counts = dataSets.map((d) => d.people?.length ?? 0);
      expect(counts[0]).toBe(counts[1]);
      if (counts.length > 2) {
        expect(counts[1]).toBe(counts[2]);
      }
    }
  });
});
