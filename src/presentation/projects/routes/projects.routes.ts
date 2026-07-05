import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  localeOptionalSchema,
  localeSchema,
  problemDetailsSchema,
  slugSchema,
} from '@domain/dtos/shared';
import {
  projectListResponseSchema,
  projectListSchema,
  projectResponseSchema,
} from '@domain/dtos/project';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { projectModel } from '@infrastructure/dbs/models/mongodb/project';
import { paginationMiddleware } from '@presentation/bootstrap/middlewares';
import type { RouteModule } from '@presentation/bootstrap/routes';
import { ProjectRepository } from '../repositories';
import { ProjectService } from '../services';
import { ProjectController } from '../controllers';

const TAGS = ['Projects'];

const listQuerySchema = z.object({ locale: localeOptionalSchema }).loose();
const featuredQuerySchema = z.object({ locale: localeOptionalSchema });
const bySlugParamsSchema = z.object({ slug: slugSchema });
const bySlugQuerySchema = z.object({ locale: localeSchema });

/**
 * Rutas de proyectos: compone las dependencias del bloque (modelo →
 * repositorio → service → controller), registra los endpoints públicos bajo
 * el prefijo v1 y documenta su esquema OpenAPI (entrada y respuestas).
 *
 * @remarks
 * La ruta estática `/projects/featured` convive con `/projects/:slug`: el
 * router de Fastify resuelve siempre la estática primero. El listado admite
 * los parámetros de paginación (`page`, `limit`) que el middleware global
 * consume, por eso su querystring los deja pasar.
 */
const projectsRoutes: FastifyPluginAsync = async app => {
  const repository = new ProjectRepository(projectModel(DatabaseConnector.getPortfolioDb()));
  const service = new ProjectService(repository);
  const controller = new ProjectController(service);

  app.get(
    '/projects',
    {
      preHandler: paginationMiddleware,
      schema: {
        tags: TAGS,
        summary: 'Listar proyectos publicados',
        querystring: listQuerySchema,
        response: {
          200: projectListResponseSchema,
          400: problemDetailsSchema,
          401: problemDetailsSchema,
        },
      },
    },
    controller.list
  );

  app.get(
    '/projects/featured',
    {
      schema: {
        tags: TAGS,
        summary: 'Listar proyectos destacados',
        querystring: featuredQuerySchema,
        response: {
          200: projectListSchema,
          400: problemDetailsSchema,
          401: problemDetailsSchema,
        },
      },
    },
    controller.featured
  );

  app.get(
    '/projects/:slug',
    {
      schema: {
        tags: TAGS,
        summary: 'Obtener proyecto publicado por slug',
        params: bySlugParamsSchema,
        querystring: bySlugQuerySchema,
        response: {
          200: projectResponseSchema,
          400: problemDetailsSchema,
          401: problemDetailsSchema,
          404: problemDetailsSchema,
        },
      },
    },
    controller.getBySlug
  );
};

/**
 * Módulo de rutas de proyectos que consume el bootstrap.
 */
export const projectsRouteModule: RouteModule = {
  name: 'Projects',
  prefix: '',
  routes: projectsRoutes,
};
