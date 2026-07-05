import '@config/timezone';
import 'reflect-metadata';
import ansiColors from 'chalk';
import { startupTimeLocal, startupTimeUTC } from '@core/helpers';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { env } from '@config/envs';
import { createServer } from '@presentation/bootstrap/server';

/**
 * Punto de entrada de la aplicación: inicializa las conexiones y levanta el
 * servidor HTTP/2.
 */
async function main(): Promise<void> {
  console.log(
    ansiColors.gray(`Server initialization started at ${startupTimeLocal} UTC: ${startupTimeUTC}`)
  );

  await DatabaseConnector.initialize(env.mongo.uri, {
    autoIndex: !env.server.isProduction,
  });

  const server = await createServer();
  await server.listen({ port: env.server.port, host: env.server.host });

  console.log(ansiColors.green(`API Server listening on ${env.server.host}:${env.server.port}`));
}

main().catch((error: unknown) => {
  console.error(ansiColors.red('Failed to start the application:'), error);
  process.exit(1);
});
