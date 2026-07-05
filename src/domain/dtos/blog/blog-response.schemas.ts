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
 * Colección plana de posts: respuesta de los listados sin paginación.
 */
export const blogPostListSchema = z.array(blogPostResponseSchema);

/**
 * Página de posts: datos y metadatos de paginación cuando la petición
 * activa la paginación con `page` o `limit`.
 */
export const paginatedBlogPostsSchema = z.object({
  data: blogPostListSchema,
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    countTotal: z.number().int(),
    nextPage: z.boolean(),
    previousPage: z.boolean(),
  }),
});

/**
 * Respuesta de los listados: array plano sin paginación, o envelope
 * paginado cuando la querystring activa la paginación.
 */
export const blogPostListResponseSchema = z.union([blogPostListSchema, paginatedBlogPostsSchema]);
