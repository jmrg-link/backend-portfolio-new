import type { FastifyPluginAsync } from 'fastify';
import {
  createUserSchema,
  idParamSchema,
  invitationResponseSchema,
  inviteUserSchema,
  listInvitationsSchema,
  listUsersSchema,
  paginatedInvitationsSchema,
  paginatedUsersSchema,
  updateUserSchema,
  userCountSchema,
  userResponseSchema,
} from '@domain/dtos/user';
import { problemDetailsSchema } from '@domain/dtos/shared';
import { ClerkUserAdapter } from '@infrastructure/external-services/clerk';
import { adminGuard } from '@presentation/bootstrap/middlewares';
import type { RouteModule } from '@presentation/bootstrap/routes';
import { UsersController } from '../controllers';

const TAGS = ['Users'];
const adminErrors = { 401: problemDetailsSchema, 403: problemDetailsSchema };

/**
 * Rutas de gestión de usuarios: compone el controller sobre el adapter de
 * Clerk y registra los endpoints de administración bajo el prefijo v1, con
 * su esquema OpenAPI (entrada y respuestas).
 *
 * @remarks
 * Toda ruta exige sesión de administrador (`adminGuard`); no hay alta
 * pública. Las rutas estáticas (`/count`, `/invitations`) se registran antes
 * que `/:id` para que tengan prioridad.
 */
const usersRoutes: FastifyPluginAsync = async app => {
  const controller = new UsersController(new ClerkUserAdapter());

  app.get(
    '/admin/users',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Listar usuarios',
        querystring: listUsersSchema,
        response: { 200: paginatedUsersSchema, 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.list
  );

  app.get(
    '/admin/users/count',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Contar usuarios',
        querystring: listUsersSchema,
        response: { 200: userCountSchema, 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.count
  );

  app.post(
    '/admin/users',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Alta administrativa de usuario',
        body: createUserSchema,
        response: {
          201: userResponseSchema,
          400: problemDetailsSchema,
          422: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.create
  );

  app.get(
    '/admin/users/invitations',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Listar invitaciones',
        querystring: listInvitationsSchema,
        response: { 200: paginatedInvitationsSchema, 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.listInvitations
  );

  app.post(
    '/admin/users/invitations',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Invitar a un usuario',
        body: inviteUserSchema,
        response: { 201: invitationResponseSchema, 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.invite
  );

  app.delete(
    '/admin/users/invitations/:id',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Revocar invitación',
        params: idParamSchema,
        response: {
          200: invitationResponseSchema,
          400: problemDetailsSchema,
          404: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.revokeInvitation
  );

  app.get(
    '/admin/users/:id',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Obtener usuario por id',
        params: idParamSchema,
        response: {
          200: userResponseSchema,
          400: problemDetailsSchema,
          404: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.get
  );

  app.patch(
    '/admin/users/:id',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Actualizar usuario',
        params: idParamSchema,
        body: updateUserSchema,
        response: {
          200: userResponseSchema,
          400: problemDetailsSchema,
          404: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.update
  );

  app.delete(
    '/admin/users/:id',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Borrar usuario',
        params: idParamSchema,
        response: { 400: problemDetailsSchema, 404: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.remove
  );
};

/**
 * Módulo de rutas de gestión de usuarios que consume el bootstrap.
 */
export const usersRouteModule: RouteModule = {
  name: 'Users',
  prefix: '',
  routes: usersRoutes,
};
