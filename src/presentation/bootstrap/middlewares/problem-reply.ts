import type { FastifyReply, FastifyRequest } from 'fastify';
import { problem, type ProblemDetails } from '@domain/shared/errors/problem-details';

/**
 * Escribe un Problem Details ya construido con la correlación
 * x-request-id: única fuente del envelope para la cadena de errores y los
 * guards.
 */
export async function writeProblemReply(
  request: FastifyRequest,
  reply: FastifyReply,
  body: ProblemDetails
): Promise<void> {
  await reply
    .header('x-request-id', String(request.id))
    .type('application/problem+json')
    .status(body.status)
    .send(body);
}

/**
 * Construye y escribe un rechazo de guard como Problem Details.
 */
export async function sendProblemReply(
  request: FastifyRequest,
  reply: FastifyReply,
  status: number,
  title: string,
  detail: string
): Promise<void> {
  await writeProblemReply(
    request,
    reply,
    problem({ status, title, detail, instance: request.url })
  );
}
