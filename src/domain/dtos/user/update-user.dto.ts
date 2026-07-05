import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  publicMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Cambio parcial de un usuario: solo los campos presentes se actualizan,
 * desde el body. El email no es editable por esta vía.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class UpdateUserDto {
  private constructor(
    public readonly firstName: string | undefined,
    public readonly lastName: string | undefined,
    public readonly username: string | undefined,
    public readonly publicMetadata: Record<string, unknown> | undefined
  ) {}

  public static fromRequest(body: unknown): UpdateUserDto {
    const parsed = updateUserSchema.parse(body);
    return new UpdateUserDto(
      parsed.firstName,
      parsed.lastName,
      parsed.username,
      parsed.publicMetadata
    );
  }
}
