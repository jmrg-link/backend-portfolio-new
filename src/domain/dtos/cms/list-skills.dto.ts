import { z } from 'zod';

/**
 * Querystring del listado público de skills: categoría opcional y filtro de
 * publicación con default true.
 */
export const listSkillsSchema = z.object({
  category: z.string().min(1).optional(),
  published: z.union([z.stringbool(), z.boolean()]).default(true),
});

/**
 * Entrada del listado público de skills: categoría opcional y filtro de
 * publicación desde la querystring.
 *
 * @remarks
 * `published` acepta las formas booleanas de querystring ('true'/'false')
 * y cae a true cuando falta.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class ListSkillsDto {
  private constructor(
    public readonly category: string | undefined,
    public readonly published: boolean
  ) {}

  public static fromRequest(query: unknown): ListSkillsDto {
    const parsed = listSkillsSchema.parse(query);
    return new ListSkillsDto(parsed.category, parsed.published);
  }
}
