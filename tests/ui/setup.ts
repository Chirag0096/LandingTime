import '@testing-library/jest-dom/vitest';

// JSDOM polyfills
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};

  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {},
      },
      writable: true,
    });
  }
}
