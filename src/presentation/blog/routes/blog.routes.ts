import type { FastifyPluginAsync } from 'fastify';
import {
  blogListQuerySchema,
  blogPostIdParamsSchema,
  blogPostListResponseSchema,
  blogPostSummaryListResponseSchema,
  blogPostResponseSchema,
  blogSlugParamsSchema,
  blogSlugQuerySchema,
  createBlogPostSchema,
  updateBlogPostBodySchema,
  updateBlogPostParamsSchema,
} from '@domain/dtos/blog';
import { problemDetailsSchema } from '@domain/dtos/shared';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { blogPostModel } from '@infrastructure/dbs/models/mongodb/blog';
import { adminGuard, paginationMiddleware } from '@presentation/bootstrap/middlewares';
import type { RouteModule } from '@presentation/bootstrap/routes';
import { BlogRepository } from '../repositories';
import { BlogService } from '../services';
import { BlogController } from '../controllers';

const TAGS = ['Blog'];
const adminErrors = { 401: problemDetailsSchema, 403: problemDetailsSchema };

/**
 * Rutas del blog: compone las dependencias del bloque (modelo → repositorio
 * → service → controller) y registra los endpoints públicos y de
 * administración bajo el prefijo v1, con su esquema OpenAPI (entrada y
 * respuestas).
 *
 * @remarks
 * Las rutas de administración acoplan `adminGuard` como preHandler. Los
 * listados devuelven un array plano o el envelope paginado según la
 * querystring, de ahí la unión en la respuesta 200.
 */
const blogRoutes: FastifyPluginAsync = async app => {
  const repository = new BlogRepository(blogPostModel(DatabaseConnector.getPortfolioDb()));
  const service = new BlogService(repository);
  const controller = new BlogController(service);

  app.get(
    '/blog',
    {
      preHandler: paginationMiddleware,
      schema: {
        tags: TAGS,
        summary: 'Listar posts publicados',
        querystring: blogListQuerySchema,
        response: {
          200: blogPostSummaryListResponseSchema,
          400: problemDetailsSchema,
          401: problemDetailsSchema,
        },
      },
    },
    controller.list
  );

  app.get(
    '/blog/:slug',
    {
      schema: {
        tags: TAGS,
        summary: 'Obtener un post publicado por su slug',
        params: blogSlugParamsSchema,
        querystring: blogSlugQuerySchema,
        response: {
          200: blogPostResponseSchema,
          400: problemDetailsSchema,
          401: problemDetailsSchema,
          404: problemDetailsSchema,
        },
      },
    },
    controller.getBySlug
  );

  app.get(
    '/admin/blog',
    {
      preHandler: [adminGuard, paginationMiddleware],
      schema: {
        tags: TAGS,
        summary: 'Listar todos los posts, incluidos los borradores',
        querystring: blogListQuerySchema,
        response: { 200: blogPostListResponseSchema, 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.adminList
  );

  app.get(
    '/admin/blog/:slug',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Obtener un post por su slug, incluidos los borradores',
        params: blogSlugParamsSchema,
        querystring: blogSlugQuerySchema,
        response: {
          200: blogPostResponseSchema,
          400: problemDetailsSchema,
          404: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.adminGetBySlug
  );

  app.post(
    '/admin/blog',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Crear un post',
        body: createBlogPostSchema,
        response: { 201: blogPostResponseSchema, 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.create
  );

  app.patch(
    '/admin/blog/:id',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Actualizar un post',
        params: updateBlogPostParamsSchema,
        body: updateBlogPostBodySchema,
        response: {
          200: blogPostResponseSchema,
          400: problemDetailsSchema,
          404: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.update
  );

  app.delete(
    '/admin/blog/:id',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Borrar un post',
        params: blogPostIdParamsSchema,
        response: { 400: problemDetailsSchema, 404: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.remove
  );

  app.post(
    '/admin/blog/:id/toggle-published',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Alternar el estado de publicación de un post',
        params: blogPostIdParamsSchema,
        response: {
          200: blogPostResponseSchema,
          400: problemDetailsSchema,
          404: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.togglePublished
  );
};

/**
 * Módulo de rutas del blog que consume el bootstrap.
 */
export const blogRouteModule: RouteModule = {
  name: 'Blog',
  prefix: '',
  routes: blogRoutes,
};
