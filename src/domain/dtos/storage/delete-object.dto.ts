import { z } from 'zod';
import { keySchema } from './storage.schemas';

export const deleteObjectSchema = z.object({ key: keySchema });

/**
 * Entrada del borrado de un objeto: clave desde la querystring.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class DeleteObjectDto {
  private constructor(public readonly key: string) {}

  public static fromRequest(query: unknown): DeleteObjectDto {
    return new DeleteObjectDto(deleteObjectSchema.parse(query).key);
  }
}
