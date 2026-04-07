module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  // ESM puro, sem globals
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    // Mock paymentService to avoid import.meta.env issues in Jest
    '^@/services/paymentService(?:\\.ts)?$': '<rootDir>/frontend/services/__mocks__/paymentService.ts',
    '^@/(.*)$': '<rootDir>/frontend/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Map all possible import paths for api service to the mock
    // Map all possible import paths for services/api to the mock
    // Handles: @/services/api, ../services/api, ./services/api, services/api, with/without .ts extension
    // This ensures the mock is always used by the component
    '^(?:@/|../|./|/)?services/api(?:\\.ts)?$': '<rootDir>/frontend/services/__mocks__/api.ts',
    
    // Mock paymentService to avoid import.meta.env issues in Jest
    '^(?:@/|../|./|/)?services/paymentService(?:\\.ts)?$': '<rootDir>/frontend/services/__mocks__/paymentService.ts',
    '^.*services/paymentService(?:\\.ts)?$': '<rootDir>/frontend/services/__mocks__/paymentService.ts',

    // Force all react and react-dom imports to resolve to the root node_modules
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
  testMatch: [
    '<rootDir>/frontend/**/*.test.tsx',
    '<rootDir>/frontend/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/frontend'],
  transformIgnorePatterns: [
    '/node_modules/(?!uuid)/',
  ],
  testPathIgnorePatterns: ['<rootDir>/archive/'],
  modulePathIgnorePatterns: ['<rootDir>/archive/'],
};

