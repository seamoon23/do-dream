import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          flow: ['@xyflow/react'],
          db: ['dexie', 'dexie-react-hooks'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
