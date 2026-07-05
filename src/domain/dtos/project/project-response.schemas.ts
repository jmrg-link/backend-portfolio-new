import { z } from 'zod';

/**
 * Representación de salida de un proyecto en las respuestas de la API. El
 * campo `content` solo viaja en la lectura por slug; los listados lo omiten.
 */
export const projectResponseSchema = z.object({
  _id: z.string().optional(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string().optional(),
  date: z.date(),
  published: z.boolean(),
  featured: z.boolean(),
  locale: z.string(),
  status: z.string(),
  tech: z.array(z.string()),
  github: z.string().nullable().optional(),
  demo: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  order: z.number().int(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Colección de proyectos: la forma de un listado sin paginar.
 */
export const projectListSchema = z.array(projectResponseSchema);

/**
 * Envelope de un listado paginado de proyectos: los elementos y sus
 * metadatos de paginación.
 */
export const projectPaginatedSchema = z.object({
  data: projectListSchema,
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    countTotal: z.number().int(),
    nextPage: z.boolean(),
    previousPage: z.boolean(),
  }),
});

/**
 * Respuesta del listado de proyectos: array plano cuando la petición no
 * activa la paginación, o envelope `{data, meta}` cuando sí lo hace.
 */
export const projectListResponseSchema = z.union([projectListSchema, projectPaginatedSchema]);
