import { z } from 'zod';

export const inviteUserSchema = z.object({
  emailAddress: z.email(),
  redirectUrl: z.url().optional(),
  publicMetadata: z.record(z.string(), z.unknown()).optional(),
  expiresInDays: z.coerce.number().int().min(1).optional(),
});

/**
 * Entrada de una invitación de alta: email obligatorio y opciones de
 * entrega, desde el body.
 *
 * @throws {ZodError} si el body no cumple el schema (la cadena de errores
 * responde 400).
 */
export class InviteUserDto {
  private constructor(
    public readonly emailAddress: string,
    public readonly redirectUrl: string | undefined,
    public readonly publicMetadata: Record<string, unknown> | undefined,
    public readonly expiresInDays: number | undefined
  ) {}

  public static fromRequest(body: unknown): InviteUserDto {
    const parsed = inviteUserSchema.parse(body);
    return new InviteUserDto(
      parsed.emailAddress,
      parsed.redirectUrl,
      parsed.publicMetadata,
      parsed.expiresInDays
    );
  }
}
