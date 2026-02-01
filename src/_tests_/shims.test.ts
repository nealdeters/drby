import * as Shim from '../../react-native-web-shim';

describe('react-native-web-shim', () => {
  it('exports TurboModuleRegistry', () => {
    expect(Shim.TurboModuleRegistry).toBeDefined();
    expect(Shim.TurboModuleRegistry.getEnforcing()).toBeNull();
  });
});