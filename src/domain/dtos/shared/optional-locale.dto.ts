import { z } from 'zod';
import { localeOptionalSchema } from './common.schemas';

const schema = z.object({ locale: localeOptionalSchema });

/**
 * Entrada de los listados multiidioma (blog, proyectos): locale opcional
 * desde la querystring — ausente significa todos los idiomas.
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class OptionalLocaleDto {
  private constructor(public readonly locale: string | undefined) {}

  public static fromRequest(query: unknown): OptionalLocaleDto {
    return new OptionalLocaleDto(schema.parse(query).locale);
  }
}
