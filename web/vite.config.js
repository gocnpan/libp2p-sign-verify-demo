import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import vue2 from '@vitejs/plugin-vue2'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8888,
    proxy: {
      // 代理 api
      "/api": {
        target: "http://127.0.0.1:8980", //要跨域的域名
        changeOrigin: true,
      },
    },
  },
  // 配置打包后的相对路径读取
  base: './',
  plugins: [
    vue2(),
    // legacy({
    //   targets: ['Chrome  > 99', "Firefox >=78", "Safari >=14", "Edge >=88"],
    //   additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    // })
  ],
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { bigint: true },
      define: {
        global: 'globalThis',
        'process.env.NODE_DEBUG': 'false',
      },
      plugins: []
    }
  }
})
