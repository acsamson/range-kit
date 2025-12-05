import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), vueJsx()],
  test: {
    // 使用 happy-dom 作为测试环境
    environment: 'happy-dom',
    // 全局测试配置
    globals: true,
    // 测试覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'docs/',
        '*.config.ts',
        '**/*.d.ts',
        '**/__test__/**',
        '**/types/**'
      ]
    },
    // 包含的测试文件
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/__test__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    // 排除的文件
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // 测试超时时间
    testTimeout: 10000,
    // 钩子超时时间
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@types': resolve(__dirname, './src/types'),
      '@constants': resolve(__dirname, './src/constants'),
      '@helpers': resolve(__dirname, './src/helpers'),
      '@utils': resolve(__dirname, './src/utils')
    }
  }
});