module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest'
  },
  transformIgnorePatterns: [
    // Transform ES module dependencies
    'node_modules/(?!(@turf|polyclip-ts|mapbox-gl|bignumber.js)/)'
  ],
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle absolute imports
    '^types/(.*)$': '<rootDir>/src/types/$1',
    '^context/(.*)$': '<rootDir>/src/context/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^services/(.*)$': '<rootDir>/src/services/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  silent: true,
  reporters: [
    ['default', { 
      filterConsoleOutput: (message) => !message.includes('ReactDOMTestUtils.act') 
    }]
  ]
};