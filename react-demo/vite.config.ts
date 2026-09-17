import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Reuse the framework-free core verbatim — no copy, no fork.
    alias: { '@perm-core': path.resolve(__dirname, '../src/core') },
  },
  server: { port: 4301 },
  preview: { port: 4301 },
});
