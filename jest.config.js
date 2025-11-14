export default {
    testEnvironment: 'jsdom',  // Changed from 'node' for React tests
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx', '**/__tests__/**/*.test.js'],
    preset: 'ts-jest',  // Add this
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        'netlify/functions/**/*.js',
        '!netlify/functions/__tests__/**',
    ],
    coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
    verbose: true,
    testTimeout: 30000,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
};