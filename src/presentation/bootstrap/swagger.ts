import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { env } from '@config/envs';

/**
 * Registra la documentación OpenAPI y su interfaz SOLO en desarrollo: expone
 * el esquema descargable en `/documentation/json` (importable en Postman) y
 * la UI en `/documentation`. Fuera de desarrollo no monta nada.
 *
 * @remarks
 * `jsonSchemaTransform` traduce los schemas Zod de cada ruta a OpenAPI. El
 * esquema de seguridad `bearerAuth` aplica a toda la API (token Clerk); el
 * health check queda sin requisito. Debe registrarse antes que las rutas
 * para capturar sus esquemas.
 */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  if (!env.server.isDevelopment) return;

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'backend-portfolio API',
        description:
          'API privada del portfolio (jmrg.dev). Toda ruta exige un token Clerk salvo el health check.',
        version: '1.0.0',
      },
      servers: [
        { url: `https://localhost:${env.server.port}`, description: 'Desarrollo local (HTTP/2 + TLS)' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token de Clerk: session_token (admin), api_key o m2m_token.',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUi, { routePrefix: '/documentation' });
}
