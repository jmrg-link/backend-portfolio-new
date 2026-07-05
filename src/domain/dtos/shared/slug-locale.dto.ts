import { z } from 'zod';
import { localeSchema, slugSchema } from './common.schemas';

const paramsSchema = z.object({ slug: slugSchema });
const querySchema = z.object({ locale: localeSchema });

/**
 * Entrada de las lecturas por slug (blog, proyectos): slug de params y
 * locale de la querystring con default del sitio.
 *
 * @throws {ZodError} si params o querystring no cumplen su schema.
 */
export class SlugLocaleDto {
  private constructor(
    public readonly slug: string,
    public readonly locale: string
  ) {}

  public static fromRequest(params: unknown, query: unknown): SlugLocaleDto {
    const { slug } = paramsSchema.parse(params);
    const { locale } = querySchema.parse(query);
    return new SlugLocaleDto(slug, locale);
  }
}
