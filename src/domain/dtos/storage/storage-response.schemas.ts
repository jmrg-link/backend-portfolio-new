import { z } from 'zod';

/**
 * URL prefirmada de descarga que devuelve la API.
 */
export const downloadUrlResponseSchema = z.object({ url: z.string() });

/**
 * URL prefirmada de subida con su clave y caducidad en segundos.
 */
export const uploadUrlResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
  expiresIn: z.number().int(),
});

/**
 * Objeto del bucket en las respuestas del listado.
 */
export const storageObjectSchema = z.object({
  key: z.string(),
  size: z.number().int(),
  lastModified: z.date(),
});

/**
 * Página de listado no recursivo: objetos del nivel, carpetas, prefijo y
 * token de continuación cuando hay más resultados.
 */
export const listObjectsResponseSchema = z.object({
  objects: z.array(storageObjectSchema),
  folders: z.array(z.string()),
  nextToken: z.string().optional(),
  prefix: z.string(),
});

/**
 * Recuento recursivo bajo un prefijo: total de objetos y de bytes.
 */
export const countObjectsResponseSchema = z.object({
  prefix: z.string(),
  totalObjects: z.number().int(),
  totalBytes: z.number().int(),
});

/**
 * Resultado del borrado masivo: claves borradas, fallidas y total solicitado.
 */
export const bulkDeleteResponseSchema = z.object({
  deleted: z.number().int(),
  failed: z.number().int(),
  total: z.number().int(),
});

/**
 * Salud del slice: accesibilidad del bucket y de la base de datos con marca
 * temporal ISO.
 */
export const storageHealthResponseSchema = z.object({
  s3: z.boolean(),
  database: z.boolean(),
  timestamp: z.string(),
});
