import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import ansiColors from 'chalk';
import { env } from '@config/envs';
import { HealthController } from './controllers';
import { blogRouteModule } from '@presentation/blog/routes';
import { projectsRouteModule } from '@presentation/projects/routes';
import { cmsRouteModule } from '@presentation/cms/routes';
import { storageRouteModule } from '@presentation/storage/routes';
import { dashboardRouteModule } from '@presentation/dashboard/routes';
import { authRouteModule } from '@presentation/auth/routes';
import { usersRouteModule } from '@presentation/users/routes';

/**
 * Contrato de módulo de rutas del proyecto.
 *
 * @remarks
 * Cada vertical slice (blog, projects, users…) exporta uno: nombre para el
 * log de arranque, prefijo propio y el plugin Fastify con sus rutas.
 */
export interface RouteModule {
  name: string;
  prefix: string;
  routes: FastifyPluginAsync;
}

/**
 * Configurador de rutas de la aplicación.
 *
 * @remarks
 * Registra el health check bajo el prefijo base y monta cada RouteModule bajo
 * `/api/v1` (prefijos desde env).
 */
export class AppRoutes {
  private static readonly modules: RouteModule[] = [
    blogRouteModule,
    projectsRouteModule,
    cmsRouteModule,
    storageRouteModule,
    dashboardRouteModule,
    authRouteModule,
    usersRouteModule,
  ];

  public constructor(private readonly app: FastifyInstance) {}

  public async initialize(): Promise<void> {
    this.registerHealthCheck();
    await this.registerV1Routes();
  }

  private registerHealthCheck(): void {
    const controller = new HealthController();
    this.app.get(`${env.server.apiPrefix}/health`, controller.check);

    console.log(ansiColors.green(`✓ Health check registered on ${env.server.apiPrefix}/health`));
  }

  private async registerV1Routes(): Promise<void> {
    const v1Prefix = `${env.server.apiPrefix}/${env.server.apiVersion}`;

    for (const module of AppRoutes.modules) {
      await this.app.register(module.routes, { prefix: `${v1Prefix}${module.prefix}` });
      console.log(
        ansiColors.yellow(`✓ ${module.name} inicializado en ${v1Prefix}${module.prefix}`)
      );
    }

    if (AppRoutes.modules.length === 0) {
      console.log(ansiColors.gray(`· Sin módulos v1 todavía (base ${v1Prefix})`));
    }
  }
}
