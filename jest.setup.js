require('@testing-library/jest-native/extend-expect');

// Mock window.matchMedia for Reanimated
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock TurboModuleRegistry to prevent Reanimated initialization errors
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.TurboModuleRegistry = {
    get: jest.fn(),
    getEnforcing: jest.fn(),
  };
  return RN;
});

// Mock Reanimated
global.__DEV__ = true;
global.ReanimatedDataMock = {
  now: () => 0,
};

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return {
    ...Reanimated,
    useSharedValue: jest.fn((v) => ({ value: v })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedProps: jest.fn(() => ({})),
    withSpring: jest.fn(),
    withTiming: jest.fn(),
    makeMutable: jest.fn((v) => ({ value: v })),
    runOnUI: jest.fn(),
    createAnimatedComponent: (Component) => Component,
  };
});

// Mock SVG
jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: 'Svg',
  Svg: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  G: 'G',
  Rect: 'Rect',
  Line: 'Line',
  Ellipse: 'Ellipse',
}));

// Mock NativeWind
jest.mock('nativewind', () => ({
  styled: (Component) => Component,
}));