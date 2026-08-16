import { z } from 'zod';

/**
 * Representación de salida de un post del blog en las respuestas de la API;
 * `content` solo viaja en las lecturas por slug (los listados lo omiten).
 */
export const blogPostResponseSchema = z.object({
  _id: z.string().optional(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string().optional(),
  date: z.date(),
  published: z.boolean(),
  featured: z.boolean(),
  locale: z.string(),
  tags: z.array(z.string()),
  image: z.string().nullable().optional(),
  author: z.string(),
  readingTime: z.number().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Forma reducida de un post para los listados públicos: omite `content` y
 * los campos que la lectura pública no necesita.
 *
 * @remarks
 * `published` es invariante en las rutas públicas —solo se sirven posts
 * publicados— y las marcas de tiempo de la colección no forman parte del
 * contrato de lectura. El detalle por slug sí conserva `updatedAt`.
 */
export const blogPostSummarySchema = blogPostResponseSchema.omit({
  content: true,
  published: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Metadatos de una página de resultados.
 */
const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  countTotal: z.number().int(),
  nextPage: z.boolean(),
  previousPage: z.boolean(),
});

/**
 * Colección plana de posts completos: listados de administración sin
 * paginación.
 */
export const blogPostListSchema = z.array(blogPostResponseSchema);

/**
 * Colección plana de posts reducidos: listados públicos sin paginación.
 */
export const blogPostSummaryListSchema = z.array(blogPostSummarySchema);

/**
 * Página de posts completos: datos y metadatos de paginación cuando la
 * petición activa la paginación con `page` o `limit`.
 */
export const paginatedBlogPostsSchema = z.object({
  data: blogPostListSchema,
  meta: paginationMetaSchema,
});

/**
 * Página de posts reducidos para las rutas públicas.
 */
export const paginatedBlogPostSummariesSchema = z.object({
  data: blogPostSummaryListSchema,
  meta: paginationMetaSchema,
});

/**
 * Respuesta de los listados de administración: array plano sin paginación,
 * o envelope paginado cuando la querystring activa la paginación.
 */
export const blogPostListResponseSchema = z.union([blogPostListSchema, paginatedBlogPostsSchema]);

/**
 * Respuesta de los listados públicos, con la misma dualidad array plano o
 * envelope paginado.
 */
export const blogPostSummaryListResponseSchema = z.union([
  blogPostSummaryListSchema,
  paginatedBlogPostSummariesSchema,
]);
