import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * 统一的vite配置文件
 * 根据环境变量BUILD_TARGET来决定构建目标：main | vue | all
 */
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const buildTarget = process.env.BUILD_TARGET || 'all'

  // 基础配置
  const baseConfig = {
    define: {
      __DEV__: !isProd,
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    },
    esbuild: {
      target: 'es2020',
      drop: isProd ? ['console', 'debugger'] : [],
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '~': resolve(__dirname, '.'),
        '@@/sdks': resolve(__dirname, 'sdks'),
        '@@/plugins': resolve(__dirname, 'plugins'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "sass:math";`,
        },
      },
    },
    build: {
      minify: 'terser',
      sourcemap: false,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'logInfo', 'logWarn', 'logError', 'logDebug', 'logSuccess'],
          passes: 2,
          dead_code: true,
          unused: true,
        },
        mangle: {
          properties: false,
        },
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        external: [
          'vue',
          '@ad-audit/orz-ui-next',
          'byted-tea-sdk',
          /\.vue$/,
          /\.scss$/,
        ],
        output: {
          exports: 'named',
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }

  // 根据构建目标配置特定选项
  if (buildTarget === 'main') {
    return {
      ...baseConfig,
      build: {
        ...baseConfig.build,
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'RangeSDK',
          fileName: () => 'index.js',
          formats: ['es'],
        },
      },
    }
  }

  if (buildTarget === 'vue') {
    return {
      ...baseConfig,
      plugins: [vue()],
      build: {
        ...baseConfig.build,
        outDir: 'dist/vue',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'vue/index.ts'),
          name: 'RangeSDKVue',
          fileName: () => 'index.js',
          formats: ['es'],
        },
      },
    }
  }

  // 默认构建所有目标 (all)
  return {
    ...baseConfig,
    plugins: [vue()],
    build: {
      ...baseConfig.build,
      outDir: 'dist',
      emptyOutDir: true,
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
          'vue/index': resolve(__dirname, 'vue/index.ts'),
        },
        name: 'RangeSDK',
        fileName: (format, entryName) => {
          if (entryName.includes('/')) {
            return `${entryName}.js`
          }
          return `${entryName}.js`
        },
        formats: ['es'],
      },
      rollupOptions: {
        ...baseConfig.build.rollupOptions,
        output: {
          exports: 'named',
          inlineDynamicImports: false,
          manualChunks: undefined,
        },
      },
    },
  }
})