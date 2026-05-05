import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  moduleNameMapper: {
    '^@/env$': '<rootDir>/test/mocks/env-mock.cjs',
    '^@/(.*)$': '<rootDir>/$1',
    '^intl-messageformat$': '<rootDir>/test/mocks/intl-messageformat-mock.cjs',
    '^@t3-oss/env-nextjs$': '<rootDir>/test/mocks/t3-env-mock.cjs',
    '^ky$': '<rootDir>/test/mocks/ky-mock.cjs',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ky|@t3-oss/env-nextjs|intl-messageformat)/)',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
