import ansiColors from 'chalk';
import type { FastifyRequest } from 'fastify';
import type { LoggerPort } from '@domain/shared/logger/logger.port';

/**
 * Helper de logging coloreado para la cadena de errores.
 *
 * Lema:
 * - 4xx (cliente): amarillo, nivel warn — no es bug del servidor.
 * - 5xx (servidor): rojo, nivel error — SÍ es bug del servidor.
 * - errores de datos (Mongo): cyan, nivel warn.
 * - no clasificados: magenta, nivel error.
 *
 * @remarks
 * chalk añade códigos ANSI solo a la consola; los formatos JSON los
 * descartan. Recibe LoggerPort por constructor: cualquier implementación
 * sirve.
 */
export class ErrorLogger {
  public constructor(private readonly logger: LoggerPort) {}

  public client(
    statusCode: number,
    request: FastifyRequest,
    message: string,
    details?: unknown
  ): void {
    const tag = ansiColors.yellow(`[CLIENT ${statusCode}]`);
    this.logger.warn(`${tag} ${request.method} ${request.url} → ${message}`, {
      statusCode,
      path: request.url,
      ...(details !== undefined && { details }),
    });
  }

  public server(
    statusCode: number,
    request: FastifyRequest,
    message: string,
    stack?: string
  ): void {
    const tag = ansiColors.red.bold(`[SERVER ${statusCode}]`);
    this.logger.error(`${tag} ${request.method} ${request.url} → ${message}`, {
      statusCode,
      path: request.url,
      ...(stack !== undefined && { stack }),
    });
  }

  public validation(request: FastifyRequest, fields: unknown): void {
    const tag = ansiColors.yellow('[VALIDATION 400]');
    this.logger.warn(`${tag} ${request.method} ${request.url}`, {
      statusCode: 400,
      path: request.url,
      fields,
    });
  }

  public mongo(request: FastifyRequest, kind: string, message: string): void {
    const tag = ansiColors.cyan(`[MONGO ${kind}]`);
    this.logger.warn(`${tag} ${request.method} ${request.url} → ${message}`, {
      statusCode: kind === 'DUPLICATE 11000' ? 409 : 400,
      path: request.url,
      kind,
    });
  }

  public unhandled(request: FastifyRequest, err: unknown): void {
    const tag = ansiColors.magenta.bold('[UNHANDLED 500]');
    const message = err instanceof Error ? err.message : String(err);
    this.logger.error(`${tag} ${request.method} ${request.url} → ${message}`, {
      statusCode: 500,
      path: request.url,
      ...(err instanceof Error && err.stack !== undefined && { stack: err.stack }),
    });
  }
}
