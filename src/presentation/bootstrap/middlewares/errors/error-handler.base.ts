import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ProblemDetails } from '@domain/shared/errors/problem-details';
import { writeProblemReply } from '../problem-reply';

/**
 * Eslabón base de la cadena de manejadores de errores.
 *
 * Cada handler:
 * - recibe el error;
 * - si lo reconoce, responde Problem Details y corta la cadena;
 * - si no, llama a `delegate` para pasarlo al siguiente.
 *
 * El último (FallbackErrorHandler) siempre responde 500.
 *
 * @remarks
 * Cada handler reconoce una única forma de error; añadir un tipo nuevo
 * (Clerk, S3…) es añadir un eslabón sin tocar los demás, y cada eslabón se
 * prueba en aislamiento.
 */
export abstract class ErrorHandler {
  protected next?: ErrorHandler;

  public setNext(handler: ErrorHandler): ErrorHandler {
    this.next = handler;
    return handler;
  }

  /**
   * Reconoce su forma de error y responde, o delega en el siguiente eslabón.
   */
  public abstract handle(err: unknown, request: FastifyRequest, reply: FastifyReply): void;

  protected delegate(err: unknown, request: FastifyRequest, reply: FastifyReply): void {
    if (this.next) {
      this.next.handle(err, request, reply);
      return;
    }
    throw err;
  }

  /**
   * Respuesta única de la cadena: Problem Details + correlación x-request-id.
   */
  protected respond(request: FastifyRequest, reply: FastifyReply, body: ProblemDetails): void {
    void writeProblemReply(request, reply, body);
  }
}
