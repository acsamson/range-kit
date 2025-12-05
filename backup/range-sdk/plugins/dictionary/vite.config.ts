import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import vue from '@vitejs/plugin-vue';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    plugins: [
      vue(),
    ],
    define: {
      __DEV__: !isProd,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '~': resolve(__dirname, '.'),
        '@@/sdks': resolve(__dirname, '../../sdks'),
      },
    },
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'RangeSDKPluginDictionary',
        fileName: (format) => format === 'es' ? 'index.esm.js' : 'index.js',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: [
          'vue',
          '@ad-audit/orz-ui-next',
          '@ad-audit/range-sdk',
          '@ad-audit/range-sdk/src/core/range-sdk-with-plugins'
        ],
        output: {
          exports: 'auto',
          globals: {
            vue: 'Vue'
          },
        },
      },
    },
  };
});
