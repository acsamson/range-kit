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
      '@l2c/range-kit-core': resolve(__dirname, '../packages/core/src/index.ts'),
      '@l2c/range-kit-vue': resolve(__dirname, '../packages/vue/src/index.ts'),
      '@l2c/range-kit-react': resolve(__dirname, '../packages/react/src/index.ts'),
    }
  },
  server: {
    port: 3666,
    open: true
  }
});
