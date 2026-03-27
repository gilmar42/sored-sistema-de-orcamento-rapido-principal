import '@testing-library/jest-dom';

// Setup environment variables for tests
process.env.VITE_MP_PUBLIC_KEY = process.env.VITE_MP_PUBLIC_KEY || 'APP_USR-test-key';
process.env.VITE_MERCADO_PAGO_PUBLIC_KEY = process.env.VITE_MERCADO_PAGO_PUBLIC_KEY || 'APP_USR-test-key';

// Provide a simple in-memory localStorage polyfill for tests
const memoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => (key in store ? store[key] : null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: memoryStorage,
  writable: true,
});

// JSDOM does not implement matchMedia; provide a minimal stub for hooks relying on it
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:3001',
    },
  },
  writable: true,
});
