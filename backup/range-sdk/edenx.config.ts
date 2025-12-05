import { moduleTools, defineConfig } from '@edenx/module-tools';
import { modulePluginVue } from '@edenx/plugin-module-vue';

export default defineConfig({
  plugins: [moduleTools(), modulePluginVue()],
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    input: ['src/index.vue'],
    dts: false,
  },
});
