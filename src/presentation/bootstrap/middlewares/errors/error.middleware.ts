import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import mongoose from 'mongoose';
import { ConcurrencyError, EmmettError } from '@event-driven-io/emmett';
import { problem } from '@domain/shared/errors/problem-details';
import type { LoggerPort } from '@domain/shared/logger/logger.port';
import { ErrorHandler } from './error-handler.base';
import { ErrorLogger } from './error-logger';

/**
 * Eslabón previo: body malformado detectado por los parsers de Fastify
 * (JSON inválido, content-type vacío…), identificable por `code` FST_ERR_CTP_*.
 *
 * @remarks
 * Sin este handler caería al fallback y terminaría como 500; aquí se mapea a
 * 400 con el detalle original truncado para que el cliente sepa qué arreglar.
 */
class BodyParseErrorHandler extends ErrorHandler {
  public constructor(private readonly elog: ErrorLogger) {
    super();
  }

  public handle(err: unknown, request: FastifyRequest, reply: FastifyReply): void {
    if (BodyParseErrorHandler.isBodyParseError(err)) {
      const detail = err.message.slice(0, 200);
      this.elog.client(400, request, 'Malformed request body', { detail });
      this.respond(
        request,
        reply,
        problem({ status: 400, title: 'Bad Request', detail, instance: request.url })
      );
      return;
    }
    this.delegate(err, request, reply);
  }

  /**
   * Indica si el error proviene de los parsers de body de Fastify.
   *
   * @remarks
   * `code` no está declarado en `Error`; el cast a `{ code?: unknown }` lo
   * lee sin asumir su presencia y el `typeof` lo estrecha a string.
   */
  private static isBodyParseError(err: unknown): err is Error & { code: string } {
    if (!(err instanceof Error)) return false;
    const code = (err as { code?: unknown }).code;
    return typeof code === 'string' && code.startsWith('FST_ERR_CTP');
  }
}

/**
 * Payload que no cumple un schema Zod, en cualquiera de las dos fronteras
 * de validación: el `ZodError` que lanza `fromRequest()` de las clases DTO
 * y el error de validación que emite el schema declarado en la ruta
 * (`fastify-type-provider-zod`). Ambos responden el mismo 400 con la lista
 * de campos rechazados.
 */
class ZodErrorHandler extends ErrorHandler {
  public constructor(private readonly elog: ErrorLogger) {
    super();
  }

  public handle(err: unknown, request: FastifyRequest, reply: FastifyReply): void {
    if (err instanceof ZodError) {
      const errors = err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      this.respondValidation(request, reply, errors);
      return;
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      const errors = err.validation.map(issue => ({
        field: issue.instancePath.slice(1).replaceAll('/', '.'),
        message: issue.message ?? 'Invalid value',
      }));
      this.respondValidation(request, reply, errors);
      return;
    }
    this.delegate(err, request, reply);
  }

  /**
   * Emite la respuesta 400 de validación con la lista normalizada de campos
   * rechazados, común a las dos fronteras.
   */
  private respondValidation(
    request: FastifyRequest,
    reply: FastifyReply,
    errors: ReadonlyArray<{ field: string; message: string }>
  ): void {
    this.elog.validation(request, errors);
    this.respond(
      request,
      reply,
      problem({
        status: 400,
        title: 'Validation Error',
        detail: 'The request payload failed schema validation',
        instance: request.url,
        extensions: { errors },
      })
    );
  }
}

/**
 * Errores de dominio de Emmett: `errorCode` es el status HTTP
 * (ValidationError 400, IllegalStateError 403, NotFoundError 404,
 * ConcurrencyError 412).
 */
class EmmettErrorHandler extends ErrorHandler {
  private static readonly titles: Readonly<Record<number, string>> = {
    400: 'Validation Error',
    403: 'Illegal State',
    404: 'Not Found',
    412: 'Precondition Failed',
  };

  public constructor(private readonly elog: ErrorLogger) {
    super();
  }

  public handle(err: unknown, request: FastifyRequest, reply: FastifyReply): void {
    if (err instanceof EmmettError) {
      const status = err.errorCode;
      const title = EmmettErrorHandler.titles[status] ?? 'Domain Error';
      const extensions =
        err instanceof ConcurrencyError
          ? { current: err.current, expected: err.expected }
          : undefined;

      if (status >= 500) this.elog.server(status, request, err.message, err.stack);
      else this.elog.client(status, request, err.message);

      this.respond(
        request,
        reply,
        problem({
          status,
          title,
          detail: err.message,
          instance: request.url,
          ...(extensions !== undefined && { extensions }),
        })
      );
      return;
    }
    this.delegate(err, request, reply);
  }
}

/**
 * Errores de datos: duplicado (11000 → 409), validación de esquema (400) y
 * cast inválido (400), sin filtrar internals de Mongo.
 */
class MongoErrorHandler extends ErrorHandler {
  public constructor(private readonly elog: ErrorLogger) {
    super();
  }

  /**
   * Mapea los errores de MongoDB a Problem Details o delega.
   *
   * @remarks
   * `keyPattern` (campos del índice duplicado) no está tipado en
   * `MongoServerError`; el cast lo lee con fallback a `{}`.
   */
  public handle(err: unknown, request: FastifyRequest, reply: FastifyReply): void {
    if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
      const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern ?? {};
      const field = Object.keys(keyPattern)[0] ?? 'field';
      this.elog.mongo(request, 'DUPLICATE 11000', `field=${field}`);
      this.respond(
        request,
        reply,
        problem({
          status: 409,
          title: 'Conflict',
          detail: `Duplicate value for '${field}'`,
          instance: request.url,
        })
      );
      return;
    }

    if (err instanceof mongoose.Error.ValidationError) {
      const errors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
      }));
      this.elog.mongo(request, 'VALIDATION', JSON.stringify(errors));
      this.respond(
        request,
        reply,
        problem({
          status: 400,
          title: 'Validation Error',
          detail: 'The document failed database validation',
          instance: request.url,
          extensions: { errors },
        })
      );
      return;
    }

    if (err instanceof mongoose.Error.CastError) {
      const detail = `Invalid ${err.path}: ${String(err.value)}`;
      this.elog.mongo(request, 'CAST', detail);
      this.respond(
        request,
        reply,
        problem({ status: 400, title: 'Bad Request', detail, instance: request.url })
      );
      return;
    }

    this.delegate(err, request, reply);
  }
}

/**
 * Eslabón terminal: responde 500 sin filtrar detalles internos jamás.
 */
class FallbackErrorHandler extends ErrorHandler {
  public constructor(private readonly elog: ErrorLogger) {
    super();
  }

  public handle(err: unknown, request: FastifyRequest, reply: FastifyReply): void {
    this.elog.unhandled(request, err);
    this.respond(
      request,
      reply,
      problem({
        status: 500,
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred',
        instance: request.url,
      })
    );
  }
}

/**
 * Arma la cadena de manejadores una vez y devuelve el handler que Fastify
 * espera en `setErrorHandler`.
 *
 * @remarks
 * Recibe LoggerPort por inyección: la cadena entera es agnóstica a la
 * implementación concreta de logging.
 */
export class ErrorHandlerMiddleware {
  public static build(
    logger: LoggerPort
  ): (err: unknown, request: FastifyRequest, reply: FastifyReply) => void {
    const elog = new ErrorLogger(logger);
    const bodyParse = new BodyParseErrorHandler(elog);
    const zod = new ZodErrorHandler(elog);
    const emmett = new EmmettErrorHandler(elog);
    const mongo = new MongoErrorHandler(elog);
    const fallback = new FallbackErrorHandler(elog);

    bodyParse.setNext(zod).setNext(emmett).setNext(mongo).setNext(fallback);

    return (err, request, reply) => bodyParse.handle(err, request, reply);
  }
}
