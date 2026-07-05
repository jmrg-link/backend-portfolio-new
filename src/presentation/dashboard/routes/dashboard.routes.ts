import type { FastifyPluginAsync } from 'fastify';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { blogPostModel } from '@infrastructure/dbs/models/mongodb/blog';
import { projectModel } from '@infrastructure/dbs/models/mongodb/project';
import { adminGuard } from '@presentation/bootstrap/middlewares';
import type { RouteModule } from '@presentation/bootstrap/routes';
import { BlogRepository } from '@presentation/blog/repositories';
import { ProjectRepository } from '@presentation/projects/repositories';
import { recentActivitySchema } from '@domain/dtos/dashboard';
import { problemDetailsSchema } from '@domain/dtos/shared';
import { DashboardService } from '../services';
import { DashboardController } from '../controllers';

/**
 * Rutas del dashboard: compone las dependencias del bloque (repositorios
 * de blog y proyectos → service → controller) y registra el timeline de
 * administración bajo el prefijo v1.
 */
const dashboardRoutes: FastifyPluginAsync = async app => {
  const db = DatabaseConnector.getPortfolioDb();
  const service = new DashboardService(
    new BlogRepository(blogPostModel(db)),
    new ProjectRepository(projectModel(db))
  );
  const controller = new DashboardController(service);

  app.get(
    '/admin/dashboard/recent-activity',
    {
      preHandler: adminGuard,
      schema: {
        tags: ['Dashboard'],
        summary: 'Actividad reciente: 5 posts + 5 proyectos, top 10 por última modificación',
        response: {
          200: recentActivitySchema,
          401: problemDetailsSchema,
          403: problemDetailsSchema,
        },
      },
    },
    controller.recentActivity
  );
};

/**
 * Módulo de rutas del dashboard que consume el bootstrap.
 */
export const dashboardRouteModule: RouteModule = {
  name: 'Dashboard',
  prefix: '',
  routes: dashboardRoutes,
};
