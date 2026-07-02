import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { DEV_API_PORT } from './src/lib/dev-port';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT ?? DEV_API_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
