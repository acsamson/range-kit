import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'range-kit', '@floating-ui/react'],
  onSuccess: async () => {
    // Copy CSS file to dist directory
    try {
        copyFileSync('src/components/selection-popover.css', 'dist/selection-popover.css');
    } catch (e) {
        console.warn('Failed to copy CSS file:', e);
    }
  }
});
