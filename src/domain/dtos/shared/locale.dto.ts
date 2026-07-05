import { z } from 'zod';
import { localeSchema } from './common.schemas';

const schema = z.object({ locale: localeSchema });

/**
 * Entrada de las lecturas que siempre resuelven un idioma: locale desde la
 * querystring con default del sitio (el contenido CMS nunca mezcla
 * idiomas).
 *
 * @throws {ZodError} si la querystring no cumple el schema (la cadena de
 * errores responde 400).
 */
export class LocaleDto {
  private constructor(public readonly locale: string) {}

  public static fromRequest(query: unknown): LocaleDto {
    return new LocaleDto(schema.parse(query).locale);
  }
}
