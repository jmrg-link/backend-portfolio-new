import { z } from 'zod';
import slugify from 'slugify';

/**
 * Locale del contenido; por defecto el del sitio.
 *
 * @defaultValue 'es'
 */
export const localeSchema = z.string().min(2).max(5).default('es');

/**
 * Locale opcional sin default: su ausencia significa todos los idiomas.
 */
export const localeOptionalSchema = z.string().min(2).max(5).optional();

/**
 * ObjectId de MongoDB en su forma hex de 24 caracteres.
 */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'must be a 24-char hex ObjectId');

/**
 * Slug canónico: la cadena debe coincidir con su propia forma
 * slugificada (minúsculas, separador guion, sin caracteres fuera del
 * alfabeto del slug) — un slug no canónico no puede existir en las
 * colecciones y se rechaza en la frontera.
 */
export const slugSchema = z
  .string()
  .min(1)
  .refine(
    value => slugify(value, { lower: true, strict: true }) === value,
    'must be a canonical slug'
  );
