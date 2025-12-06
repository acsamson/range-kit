import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'examples',
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@life2code/range-kit': resolve(__dirname, 'src'),
    },
  },
});
