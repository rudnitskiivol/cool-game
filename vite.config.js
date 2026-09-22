import { defineConfig } from 'vite';

export default defineConfig({
  // Capacitor serves the bundle from a local origin, so asset URLs must be relative.
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0 },
  server: { host: true },
});
