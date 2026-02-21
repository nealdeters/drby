module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '\\.(css|less|scss|sass)$': '<rootDir>/styleMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-native-web|react-native-reanimated|react-native-svg|@react-native|@react-navigation|nativewind|react-native-worklets)/)',
  ],
  testMatch: [
    '<rootDir>/src/_tests_/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/netlify/functions/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  testPathIgnorePatterns: ['/node_modules/', 'vite.config.test.ts'],
};