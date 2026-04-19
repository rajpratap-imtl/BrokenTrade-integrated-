import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const backendTarget = env.VITE_PROXY_BACKEND_TARGET || 'http://localhost:5000';

  return {
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    publicPath: "",
    server: {
      host: '0.0.0.0',
      port: Number(env.FRONTEND_PORT || 5173),
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/markets": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/candles": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
