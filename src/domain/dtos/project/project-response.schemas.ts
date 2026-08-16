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
 * Forma reducida de un proyecto para los listados públicos: omite `content`
 * y los campos que la lectura pública no necesita.
 *
 * @remarks
 * `published` es invariante en las rutas públicas —solo se sirven proyectos
 * publicados— y las marcas de tiempo de la colección no forman parte del
 * contrato de lectura.
 */
export const projectSummarySchema = projectResponseSchema.omit({
  content: true,
  published: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Colección de proyectos reducidos: la forma de un listado sin paginar.
 */
export const projectListSchema = z.array(projectSummarySchema);

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
