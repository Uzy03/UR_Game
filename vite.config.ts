import { defineConfig } from 'vite';

export default defineConfig({
  // Rapier's WASM glue and the WASM asset must share the same module instance in development.
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d'],
  },
});
