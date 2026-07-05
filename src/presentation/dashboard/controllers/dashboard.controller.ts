import type { FastifyReply, FastifyRequest } from 'fastify';
import type { IDashboardService } from '../services';

/**
 * Frontera HTTP del dashboard de administración: sin entrada que validar,
 * representa el timeline que compone el service.
 */
export class DashboardController {
  public constructor(private readonly service: IDashboardService) {}

  public readonly recentActivity = async (
    _request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const activities = await this.service.recentActivity();
    await reply.send(activities);
  };
}
