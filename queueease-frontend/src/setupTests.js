import '@testing-library/jest-dom';

// Add TextEncoder and TextDecoder for mapbox-gl
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock mapbox-gl
jest.mock('mapbox-gl', () => ({
  Map: jest.fn(() => ({
    on: jest.fn(),
    remove: jest.fn(),
    getCanvas: jest.fn(() => ({ style: {} })),
    getZoom: jest.fn(),
    flyTo: jest.fn(),
    addSource: jest.fn(),
    getSource: jest.fn(() => ({
      getClusterExpansionZoom: jest.fn((_, cb) => cb(null, 1)),
      getClusterLeaves: jest.fn(),
    })),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    isStyleLoaded: jest.fn(() => true),
    setPaintProperty: jest.fn(),
    getStyle: jest.fn(() => ({ layers: [] })),
  })),
  NavigationControl: jest.fn(),
  AttributionControl: jest.fn(),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn(() => ({
      addTo: jest.fn(() => ({
        setPopup: jest.fn(),
      })),
      remove: jest.fn(),
    })),
  })),
  Popup: jest.fn(() => ({
    setLngLat: jest.fn(() => ({
      setHTML: jest.fn(() => ({
        addTo: jest.fn(),
      })),
    })),
    remove: jest.fn(),
  })),
}));