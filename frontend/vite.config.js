import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client (used by the live-race WebSocket view) assumes Node's
  // `global` exists, which webpack polyfills but Vite does not. Without
  // this, importing sockjs-client throws "global is not defined" in the
  // browser as soon as the bundle loads.
  define: {
    global: 'globalThis'
  },
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['unloved-unpinned-unify.ngrok-free.dev']
  }
});
