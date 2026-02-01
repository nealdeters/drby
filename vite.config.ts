import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: ['react-native-reanimated/plugin'],
    },
  })],
  server: {
    host: '0.0.0.0',
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: 'react-native/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve('./react-native-shim.js'),
      },
      {
        find: 'react-native/Libraries/Renderer/shims/ReactFabric',
        replacement: path.resolve('./react-native-shim.js'),
      },
      {
        find: 'react-native',
        replacement: path.resolve('./react-native-web-shim.js'),
      },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  define: {
    global: 'window',
    'process.env': {},
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  optimizeDeps: {
    include: ['buffer', 'react-native-reanimated', 'nativewind', 'react-native-svg'],
    exclude: ['react-native'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
      resolveExtensions: [
        '.web.tsx',
        '.web.ts',
        '.web.jsx',
        '.web.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
      ],
    },
  },
});
