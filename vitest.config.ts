import path from 'node:path';

import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, './'),
      'next/server': 'next/server.js',
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      all: false,
    },
  },
});
