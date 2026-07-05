import { z } from 'zod';

/**
 * Cuerpo de error según RFC 9457 para documentar las respuestas de error en
 * OpenAPI; admite las extensiones del contrato (`errors[]`, `current`…) sin
 * recortarlas al serializar.
 */
export const problemDetailsSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string().optional(),
    instance: z.string().optional(),
  })
  .catchall(z.unknown());
