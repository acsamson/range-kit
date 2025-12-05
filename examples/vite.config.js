import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    vue()
  ],
  resolve: {
    alias: {
      '@life2code/range-kit-core': resolve(__dirname, '../core/src/index.ts'),
      '@life2code/range-kit-vue': resolve(__dirname, '../vue/src/index.ts'),
      '@life2code/range-kit-react': resolve(__dirname, '../react/src/index.ts'),
    }
  },
  server: {
    port: 3666,
    open: true
  }
});
