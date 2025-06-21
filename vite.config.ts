import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Match your previous .env setting
  },
  resolve: {
    alias: {
      // Optional: add aliases if you used them in CRA
    },
  },
});
