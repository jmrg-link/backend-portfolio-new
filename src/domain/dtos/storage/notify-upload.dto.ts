import { z } from 'zod';
import { keySchema } from './storage.schemas';

export const notifyUploadSchema = z.object({ key: keySchema });

/**
 * Entrada de la notificación de subida completada: clave desde el body.
 *
 * @remarks
 * La subida real va del navegador a S3 con PUT directo a la URL
 * prefirmada; el cliente notifica al terminar para invalidar cachés.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class NotifyUploadDto {
  private constructor(public readonly key: string) {}

  public static fromRequest(body: unknown): NotifyUploadDto {
    return new NotifyUploadDto(notifyUploadSchema.parse(body).key);
  }
}
