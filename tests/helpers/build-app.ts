import Fastify, { type FastifyInstance } from 'fastify';
import { env } from '@config/envs';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { createApp } from '@presentation/bootstrap/app';

/**
 * Construye la aplicación completa para pruebas funcionales: conexión real
 * a la MongoDB local y composición íntegra de plugins, guards, rutas y
 * cadena de errores — la misma app que sirve producción, inyectable sin
 * abrir puertos.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  await DatabaseConnector.initialize(env.mongo.uri);
  return createApp(Fastify());
}

/**
 * Libera la app y la conexión a base de datos al terminar la suite.
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close();
  await DatabaseConnector.disconnect();
}
