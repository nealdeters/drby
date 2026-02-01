import { describe, it, expect } from 'vitest';
import config from '../../vite.config';
import { UserConfig } from 'vite';

describe('vite.config', () => {
  it('should have plugins configured', () => {
    const plugins = (config as UserConfig).plugins;
    expect(plugins).toBeDefined();
    expect(Array.isArray(plugins)).toBe(true);
  });

  it('should have reanimated fix plugin', () => {
    const plugins = (config as UserConfig).plugins as any[];
    const fixPlugin = plugins.find((p: any) => p.name === 'fix-reanimated-version-check');
    expect(fixPlugin).toBeDefined();
  });

  it('should have correct server configuration for Docker', () => {
    const serverConfig = (config as UserConfig).server;

    expect(serverConfig).toBeDefined();
    expect(serverConfig?.host).toBe(true);
    expect(serverConfig?.port).toBe(5174);
    expect(serverConfig?.strictPort).toBe(true);
    expect(serverConfig?.watch?.usePolling).toBe(true);
  });

  it('should have correct alias configuration', () => {
    const alias = (config as UserConfig).resolve?.alias as Record<string, string>;
    expect(alias).toBeDefined();
    expect(alias['react-native']).toContain('react-native-web');
    expect(alias['react-native/Libraries/Utilities/codegenNativeComponent']).toContain('react-native-shims.js');
  });

  it('should have correct optimizeDeps configuration', () => {
    const optimizeDeps = (config as UserConfig).optimizeDeps;

    expect(optimizeDeps).toBeDefined();
    expect(optimizeDeps?.include).toContain('buffer');
    expect(optimizeDeps?.include).toContain('react-native-svg');
    expect(optimizeDeps?.exclude).toContain('react-native-reanimated');
    expect(optimizeDeps?.exclude).not.toContain('react-native-svg');
    expect(optimizeDeps?.esbuildOptions?.resolveExtensions).toBeDefined();
    expect(optimizeDeps?.esbuildOptions?.loader?.['.js']).toBe('jsx');
  });
});