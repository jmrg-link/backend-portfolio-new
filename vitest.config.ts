import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Configuración de Vitest: pruebas funcionales contra la app real (inject
 * de Fastify + MongoDB local); los alias replican los paths del tsconfig.
 *
 * @remarks
 * Los umbrales de cobertura actúan como trinquete: reflejan la última
 * cobertura alcanzada y la orden falla si un cambio la hace caer.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
      '@presentation': fileURLToPath(new URL('./src/presentation', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { NODE_ENV: 'local' },
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'text-summary'],
      thresholds: { lines: 88, functions: 90, branches: 62, statements: 87 },
    },
  },
});
