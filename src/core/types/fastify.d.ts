import type { PaginationParams } from '@domain/shared/pagination/pagination.types';
import type { ApiCaller } from '@infrastructure/external-services/clerk';

/**
 * Augmentations del request de Fastify propias del proyecto.
 *
 * @remarks
 * `pagination` la inyecta el middleware de paginación cuando la ruta lo
 * acopla y la petición trae `page` o `limit`; ausente = respuesta plana.
 * `caller` la inyecta el guard global de API tras verificar el token;
 * ausente solo en las rutas exentas (health).
 */
declare module 'fastify' {
  interface FastifyRequest {
    pagination?: PaginationParams;
    caller?: ApiCaller;
  }
}
