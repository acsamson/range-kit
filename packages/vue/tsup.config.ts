import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['vue', 'range-kit'],
  onSuccess: async () => {
    // 复制 CSS 文件到 dist 目录
    copyFileSync('src/components/selection-popover.css', 'dist/selection-popover.css');
  }
});
