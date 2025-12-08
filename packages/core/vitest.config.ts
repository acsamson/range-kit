import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/__test__/**',
        'src/**/types/**',
        'src/**/index.ts',
      ],
      // 覆盖率阈值（暂时设置为当前水平，后续逐步提升）
      thresholds: {
        lines: 20,
        functions: 35,
        branches: 50,
        statements: 20,
      },
    },
  },
  resolve: {
    alias: {
      'range-kit': resolve(__dirname, 'src'),
    },
  },
});
