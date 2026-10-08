import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const setup = 'tests/unit/setup.ts';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: existsSync(setup) ? [setup] : [],
    restoreMocks: true,
  },
});
