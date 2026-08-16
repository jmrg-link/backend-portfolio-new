import { z } from 'zod';

/**
 * Representación de salida de la configuración global del sitio (singleton
 * por locale) en las respuestas de la API.
 */
export const siteSettingsResponseSchema = z.object({
  _id: z.string().optional(),
  locale: z.string(),
  siteName: z.string(),
  siteTitle: z.string(),
  description: z.string(),
  ogImage: z.string().nullable().optional(),
  author: z.string(),
  email: z.string(),
  github: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  manfred: z.string().nullable().optional(),
  cvUrl: z.string().nullable().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Representación de salida del contenido del hero (uno por locale).
 */
export const heroContentResponseSchema = z.object({
  _id: z.string().optional(),
  locale: z.string(),
  greeting: z.string(),
  description: z.string(),
  location: z.string(),
  availability: z.string(),
  profileImage: z.string(),
  updatedAt: z.date().optional(),
});

/**
 * Representación de salida del contenido de About (uno por locale);
 * `eduContent`, `philContent` y `facts` viajan como cadenas JSON (arrays
 * serializados).
 */
export const aboutContentResponseSchema = z.object({
  _id: z.string().optional(),
  locale: z.string(),
  badge: z.string(),
  title: z.string(),
  mainText: z.string(),
  eduTitle: z.string(),
  eduContent: z.string(),
  philTitle: z.string(),
  philContent: z.string(),
  factsTitle: z.string(),
  facts: z.string(),
  image: z.string().nullable().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Representación de salida de una skill del portfolio (compartida entre
 * idiomas).
 */
export const skillResponseSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  category: z.string(),
  icon: z.string(),
  order: z.number(),
  published: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Forma reducida de una skill para el listado público.
 *
 * @remarks
 * `published` repite el filtro de la petición para todos los elementos y
 * las marcas de tiempo de la colección no forman parte del contrato de
 * lectura; en una colección de documentos pequeños esos tres campos pesan
 * tanto como el dato.
 */
export const skillSummarySchema = skillResponseSchema.omit({
  published: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Listado de skills.
 */
export const skillListSchema = z.array(skillSummarySchema);

/**
 * Representación de salida de una experiencia laboral (una por locale).
 */
export const experienceResponseSchema = z.object({
  _id: z.string().optional(),
  locale: z.string(),
  company: z.string(),
  position: z.string(),
  period: z.string(),
  tasks: z.array(z.string()),
  color: z.string(),
  order: z.number(),
  published: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Forma reducida de una experiencia para el listado público: sin los campos
 * de administración ni las marcas de tiempo de la colección.
 */
export const experienceSummarySchema = experienceResponseSchema.omit({
  published: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Listado de experiencias.
 */
export const experienceListSchema = z.array(experienceSummarySchema);

/**
 * Representación de salida de un testimonio (uno por locale).
 */
export const testimonialResponseSchema = z.object({
  _id: z.string().optional(),
  locale: z.string(),
  author: z.string(),
  initials: z.string(),
  position: z.string(),
  text: z.string(),
  date: z.string(),
  gradient: z.string(),
  order: z.number(),
  published: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Forma reducida de un testimonio para el listado público; `date` es un
 * campo propio del contenido y se conserva.
 */
export const testimonialSummarySchema = testimonialResponseSchema.omit({
  published: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Listado de testimonios.
 */
export const testimonialListSchema = z.array(testimonialSummarySchema);
