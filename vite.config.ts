import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true
  },
  test: {
    environment: 'jsdom',
    include: ['src/test/**/*.test.ts', 'src/test/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**'],
      reporter: ['text-summary']
    }
  }
});
