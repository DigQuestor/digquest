import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './client/src/assets'),
    },
  },
  build: {
    outDir: 'dist/client',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html')
      }
    }
  },
  root: 'client',
});