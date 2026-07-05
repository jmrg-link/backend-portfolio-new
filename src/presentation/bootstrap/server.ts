import Fastify, { type FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import ansiColors from 'chalk';
import { env } from '@config/envs';
import { createApp } from './app';

const baseOptions = {
  logger: false,
  bodyLimit: 10 * 1024 * 1024,
  requestIdHeader: 'x-request-id',
} as const;

/**
 * Crea la instancia Fastify con HTTP/2 gestionado por la propia aplicación.
 *
 * - Con TLS_CERT_PATH + TLS_KEY_PATH: HTTPS + HTTP/2 nativo. El certificado es
 *   la firma del servidor y ALPN negocia h2 (con fallback http/1.1) — nunca un
 *   wrapper HTTP/1 por debajo.
 * - Sin certs (local / detrás de Traefik interno): HTTP/2 cleartext (h2c).
 *
 * @remarks
 * Cast único y localizado: los overloads http2/https de Fastify producen
 * instancias con genéricos raw incompatibles entre sí; el runtime es idéntico
 * y el resto de capas usa FastifyInstance estándar.
 */
function buildInstance(): FastifyInstance {
  const { certPath, keyPath, enabled } = env.server.tls;

  if (enabled && certPath !== undefined && keyPath !== undefined) {
    console.log(ansiColors.green('✓ HTTP/2 + TLS (ALPN h2 / http1.1)'));
    return Fastify({
      ...baseOptions,
      http2: true,
      https: {
        allowHTTP1: true,
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      },
    }) as unknown as FastifyInstance;
  }

  console.log(ansiColors.yellow('⚠ HTTP/2 cleartext (h2c) — sin TLS, uso local o tras Traefik'));
  return Fastify({ ...baseOptions, http2: true }) as unknown as FastifyInstance;
}

/**
 * Crea el servidor completo: instancia con protocolo + aplicación compuesta.
 */
export async function createServer(): Promise<FastifyInstance> {
  return createApp(buildInstance());
}
