import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { authMeSchema, devTokenSchema } from '@domain/dtos/auth';
import { problemDetailsSchema } from '@domain/dtos/shared';
import { env } from '@config/envs';
import { ClerkDevTokenAdapter } from '@infrastructure/external-services/clerk';
import { authAdapter } from '@presentation/bootstrap/middlewares';
import type { RouteModule } from '@presentation/bootstrap/routes';
import { AuthController } from '../controllers';

/**
 * Rutas de autenticación: compone el controller sobre el adapter
 * compartido y registra la identidad de la petición bajo el prefijo v1.
 */
const authRoutes: FastifyPluginAsync = async app => {
  const controller = new AuthController(authAdapter);

  app.get(
    '/auth/me',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Identidad verificada de la petición actual',
        response: { 200: authMeSchema, 401: problemDetailsSchema },
      },
    },
    controller.me
  );

  if (env.server.isDevelopment) {
    const devTokenAdapter = new ClerkDevTokenAdapter();
    app.get(
      '/auth/dev-token',
      {
        schema: {
          tags: ['Auth'],
          security: [],
          summary: 'Emite un token de sesión del administrador (solo desarrollo) para Postman/Swagger',
          response: { 200: devTokenSchema, 404: problemDetailsSchema, 502: problemDetailsSchema },
        },
      },
      async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const result = await devTokenAdapter.issueAdminToken();
        await reply.send(result);
      }
    );
  }
};

/**
 * Módulo de rutas de autenticación que consume el bootstrap.
 */
export const authRouteModule: RouteModule = {
  name: 'Auth',
  prefix: '',
  routes: authRoutes,
};
