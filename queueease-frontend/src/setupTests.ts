import '@testing-library/jest-dom';
import { act } from 'react';

// Mock TextEncoder/TextDecoder for mapbox-gl
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add specific mocks for turf.js functions used in your code
jest.mock('@turf/turf', () => ({
  circle: jest.fn(() => ({ type: 'Feature', geometry: { type: 'Polygon' }, properties: {} })),
  // Add other turf functions you use
}));

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    remove: jest.fn(),
    getCanvas: jest.fn(() => ({ style: {} })),
    getZoom: jest.fn(),
    flyTo: jest.fn(),
    easeTo: jest.fn(),
    addSource: jest.fn(),
    getSource: jest.fn(() => ({
      setData: jest.fn(),
      getClusterExpansionZoom: jest.fn((_, cb) => cb(null, 1)),
    })),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    isStyleLoaded: jest.fn(() => true),
    setPaintProperty: jest.fn(),
    addControl: jest.fn(),
  })),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
}));

// MOST IMPORTANT SECTION - override the console.error before any tests run
// This completely prevents the React act() warning from being displayed
const originalConsoleError = console.error;
console.error = function (message: any, ...args: any[]) {
  if (message && typeof message === 'string') {
    // Check for React act() warning and ignore it
    if (message.includes('Warning: `ReactDOMTestUtils.act` is deprecated')) {
      return;
    }
    // Other warnings you want to silence
    if (message.includes('Warning: validateDOMNesting')) {
      return;
    }
    if (message.includes('Warning: ReactDOM.render is no longer supported')) {
      return;
    }
  }
  // Pass other errors through
  originalConsoleError.call(console, message, ...args);
};

// Restore original console.error after all tests complete
afterAll(() => {
  console.error = originalConsoleError;
});
