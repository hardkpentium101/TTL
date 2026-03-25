import '@testing-library/jest-dom';
import React from 'react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  store: {},
  clear: function() {
    this.store = {};
  },
  getItem: function(key) {
    return this.store[key] || null;
  },
  setItem: function(key, value) {
    this.store[key] = String(value);
  },
  removeItem: function(key) {
    delete this.store[key];
  },
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out React-specific warnings that are expected in tests
  if (
    args[0]?.includes?.('ErrorBoundary') ||
    args[0]?.includes?.('Test error')
  ) {
    return;
  }
  originalConsoleError(...args);
};
