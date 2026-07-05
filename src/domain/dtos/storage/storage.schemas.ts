import { z } from 'zod';

/**
 * Tipos MIME admitidos en subidas: solo imágenes web.
 */
export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'] as const;

/**
 * Máximo de claves por operación de borrado masivo.
 */
export const MAX_BULK_DELETE = 20;

/**
 * Forma general de una clave S3 existente (copias): letras, dígitos,
 * guiones, subrayados, barras y puntos.
 */
export const S3_KEY_REGEX = /^[a-zA-Z0-9\-_/.]+$/;

/**
 * Forma de una clave de subida: ruta sin puntos intermedios con extensión
 * final en minúsculas.
 */
export const UPLOAD_KEY_REGEX = /^[a-zA-Z0-9\-_/]+\.[a-z]+$/;

/**
 * Clave S3 no vacía, sin restricción de forma (lecturas y borrados).
 */
export const keySchema = z.string().min(1);
