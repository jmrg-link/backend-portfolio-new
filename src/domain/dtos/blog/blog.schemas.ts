import { z } from 'zod';
import {
  localeOptionalSchema,
  localeSchema,
  objectIdSchema,
  slugSchema,
} from '../shared/common.schemas';

export { localeSchema, localeOptionalSchema, objectIdSchema };

/**
 * Querystring de los listados de posts: locale opcional (ausente devuelve
 * todos los idiomas) y controles de paginación opt-in; `page` y `limit`
 * viajan como texto y los normaliza el middleware de paginación.
 */
export const blogListQuerySchema = z.object({
  locale: localeOptionalSchema,
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * Parámetro de ruta de las lecturas de un post por su slug canónico.
 */
export const blogSlugParamsSchema = z.object({ slug: slugSchema });

/**
 * Querystring de las lecturas por slug: locale del contenido con el default
 * del sitio.
 */
export const blogSlugQuerySchema = z.object({ locale: localeSchema });
