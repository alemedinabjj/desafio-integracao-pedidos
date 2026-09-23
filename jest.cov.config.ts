import type { Config } from 'jest';

/**
 * Cobertura combinada: roda unitários + e2e juntos. Só os unitários dariam
 * uma cobertura enganosa, porque controllers, services e a reconciliação são
 * exercitados de verdade pelos testes e2e (contra Postgres real).
 */
const config: Config = {
  projects: ['<rootDir>/jest.config.ts', '<rootDir>/test/jest-e2e.json'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/database/data-source.ts',
    '!src/database/migrations/**',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'text-summary', 'html'],
};

export default config;
