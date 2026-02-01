module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\.(css|less)$': 'identity-obj-proxy',
    'react-native': 'react-native-web',
  },
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@react-native|react-native|react-native-web|react-native-reanimated|react-native-svg)/)',
  ],
};