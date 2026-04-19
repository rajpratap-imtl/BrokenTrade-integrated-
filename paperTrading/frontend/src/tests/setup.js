import { vi } from 'vitest';

// Mock window.location
delete window.location;
window.location = { href: '' };

// Setup localStorage mock
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock fetch globally
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  window.location.href = '';
  vi.clearAllMocks();
});
