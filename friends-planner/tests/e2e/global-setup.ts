import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');

async function globalSetup(): Promise<void> {
  // Global setup: runs once before all tests
  // The webServer config in playwright.config.ts handles starting the dev server
  console.log('Global setup: running seed to clear throttles and reset state...');

  try {
    // Run seed with --base-url to match the test's BASE_URL
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:8888';

    // Run seed with retry logic
    // The seed deletes all existing people, clears throttles, and creates demo data
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        execSync(`npm run seed -- --base-url ${baseUrl}`, {
          cwd: process.cwd(),
          stdio: 'inherit',
        });
        console.log('Seed completed successfully.');
        return;
      } catch (error) {
        lastError = error as Error;
        retries--;
        if (retries > 0) {
          console.log(`Seed failed, retrying (${retries} attempts left)...`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error('Seed failed after retries');
  } catch (error) {
    console.error('Global setup seed failed:', error);
    throw error;
  }
}

export default globalSetup;
