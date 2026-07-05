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
 * Listado de skills.
 */
export const skillListSchema = z.array(skillResponseSchema);

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
 * Listado de experiencias.
 */
export const experienceListSchema = z.array(experienceResponseSchema);

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
 * Listado de testimonios.
 */
export const testimonialListSchema = z.array(testimonialResponseSchema);
