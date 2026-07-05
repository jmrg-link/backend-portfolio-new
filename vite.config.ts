import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Build del backend: bundle ESM para Node 24 con los alias del tsconfig.
 *
 * @remarks
 * tsc solo typechequea (noEmit); vite emite dist/main.js con las dependencias
 * externalizadas (build SSR). tsx cubre el modo dev.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
      '@presentation': fileURLToPath(new URL('./src/presentation', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
    },
  },
  build: {
    ssr: 'src/main.ts',
    outDir: 'dist',
    target: 'node24',
    sourcemap: true,
    rollupOptions: {
      output: { entryFileNames: 'main.js' },
    },
  },
});
