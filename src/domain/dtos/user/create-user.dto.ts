import { z } from 'zod';

export const createUserSchema = z.object({
  emailAddress: z.email(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  publicMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Entrada del alta administrativa de un usuario: email obligatorio y perfil
 * opcional, desde el body.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class CreateUserDto {
  private constructor(
    public readonly emailAddress: string,
    public readonly password: string | undefined,
    public readonly firstName: string | undefined,
    public readonly lastName: string | undefined,
    public readonly username: string | undefined,
    public readonly publicMetadata: Record<string, unknown> | undefined
  ) {}

  public static fromRequest(body: unknown): CreateUserDto {
    const parsed = createUserSchema.parse(body);
    return new CreateUserDto(
      parsed.emailAddress,
      parsed.password,
      parsed.firstName,
      parsed.lastName,
      parsed.username,
      parsed.publicMetadata
    );
  }
}
