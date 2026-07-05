import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import ansiColors from 'chalk';
import { env } from '@config/envs';
import { ConsoleLoggerAdapter } from '@core/adapters/console-logger.adapter';
import { ErrorHandlerMiddleware } from './middlewares/errors/error.middleware';
import { apiGuard } from './middlewares/api-guard.middleware';
import { registerSwagger } from './swagger';
import { AppRoutes } from './routes';

/**
 * Compone la aplicación Fastify: seguridad, compresión, validación Zod,
 * logging HTTP, rutas y cadena de errores.
 *
 * @remarks
 * Recibe la instancia ya creada: en Fastify el protocolo (HTTP/2, TLS) se
 * fija en el constructor ({@link buildInstance}).
 */
export async function createApp(app: FastifyInstance): Promise<FastifyInstance> {
  const logger = new ConsoleLoggerAdapter();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, {
    origin: env.server.corsOrigins.length > 0 ? env.server.corsOrigins : false,
  });
  await app.register(compress);
  app.addHook('onRequest', apiGuard);

  app.addHook('onResponse', (request, reply, done) => {
    const status = reply.statusCode;
    const color =
      status >= 500 ? ansiColors.red : status >= 400 ? ansiColors.yellow : ansiColors.green;
    logger.info(
      `${ansiColors.cyan('[HTTP]')} ${request.method} ${request.url} ${color(String(status))} ${reply.elapsedTime.toFixed(1)}ms`
    );
    done();
  });

  app.setErrorHandler(ErrorHandlerMiddleware.build(logger));

  await registerSwagger(app);
  await new AppRoutes(app).initialize();

  return app;
}
