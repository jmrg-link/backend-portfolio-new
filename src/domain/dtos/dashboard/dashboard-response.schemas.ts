import { z } from 'zod';

/**
 * Elemento del timeline de actividad reciente en las respuestas de la API.
 */
export const recentActivityItemSchema = z.object({
  type: z.enum(['post', 'project']),
  _id: z.string().optional(),
  slug: z.string(),
  title: z.string(),
  locale: z.string(),
  date: z.date().optional(),
  published: z.boolean(),
});

/**
 * Timeline de actividad reciente: hasta 10 elementos ordenados por última
 * modificación.
 */
export const recentActivitySchema = z.array(recentActivityItemSchema);
