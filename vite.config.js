import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Capacitor serves the bundle from a local origin, so asset URLs must be relative.
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0 },
  server: { host: true },
  plugins: [
    VitePWA({
      // 'autoUpdate' makes the generated service worker call skipWaiting() +
      // clients.claim() itself, so the *next* time a player opens the app the
      // new build takes over immediately instead of the old SW pinning them
      // to stale precached assets forever.
      registerType: 'autoUpdate',
      // We call registerSW() ourselves in src/main.js, gated to production
      // builds only -- see the comment there for why. injectRegister: false
      // stops the plugin from also injecting its own <script> into
      // index.html (which would run under `vite dev` too).
      injectRegister: false,
      // Belt-and-braces: even if something enables the plugin unexpectedly,
      // never emit/register a service worker for the dev server. A SW
      // caching the dev module graph is exactly the kind of "why is my
      // change not showing up" trap this project can't afford while the
      // game is still being tuned daily.
      devOptions: { enabled: false },
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'],
      manifest: {
        name: 'Cool Game',
        short_name: 'Cool Game',
        description: 'A one-tap Flappy-Bird-style arcade flyer with synthesized audio.',
        // Relative to the manifest URL, so this keeps working regardless of
        // the subpath the build is deployed under (matches vite.config's
        // relative `base`).
        start_url: '.',
        scope: '.',
        // display_override lets modern Chrome use true fullscreen (no system
        // bars at all); browsers that don't understand display_override (or
        // that reject fullscreen for this app) fall back to the plain
        // `display` value below, which every PWA-capable browser supports.
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        // COLORS.sky from src/config.js -- keep these in sync if that ever changes.
        background_color: '#0f1220',
        theme_color: '#0f1220',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Vite emits hashed filenames (e.g. main.a1b2c3.js), so this glob is
        // resolved against the actual `dist` output at build time -- the
        // precache manifest (and its revision hashes) is generated fresh on
        // every `vite build` rather than hand-maintained, so it can't rot.
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
