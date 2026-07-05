import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().min(1) });

/**
 * Identificador de recurso tomado de la ruta (`:id`): id de usuario o de
 * invitación de Clerk.
 *
 * @throws {ZodError} si falta o está vacío (la cadena de errores responde
 * 400).
 */
export class IdParamDto {
  private constructor(public readonly id: string) {}

  public static fromRequest(params: unknown): IdParamDto {
    return new IdParamDto(idParamSchema.parse(params).id);
  }
}
