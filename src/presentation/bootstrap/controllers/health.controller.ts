import type { FastifyReply, FastifyRequest } from 'fastify';
import { timeAdapter } from '@core/adapters/time.adapter';

/**
 * Frontera HTTP del health check base: estado del proceso sin tocar
 * dependencias externas — vivo mientras el event loop responda.
 */
export class HealthController {
  public readonly check = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await reply.send({
      status: 'ok',
      service: 'backend-portfolio',
      timestamp: timeAdapter.nowISO(),
      uptime: process.uptime(),
    });
  };
}
