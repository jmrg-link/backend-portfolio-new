import type { FastifyPluginAsync } from 'fastify';
import {
  bulkDeleteResponseSchema,
  bulkDeleteSchema,
  copyObjectSchema,
  countObjectsResponseSchema,
  countObjectsSchema,
  deleteObjectSchema,
  downloadUrlResponseSchema,
  getDownloadUrlSchema,
  getUploadUrlSchema,
  listObjectsResponseSchema,
  listObjectsSchema,
  notifyUploadSchema,
  storageHealthResponseSchema,
  uploadUrlResponseSchema,
} from '@domain/dtos/storage';
import { problemDetailsSchema } from '@domain/dtos/shared';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { S3StorageAdapter } from '@infrastructure/external-services/s3';
import { adminGuard } from '@presentation/bootstrap/middlewares';
import type { RouteModule } from '@presentation/bootstrap/routes';
import { StorageController } from '../controllers';

const TAGS = ['Storage'];
const adminErrors = { 401: problemDetailsSchema, 403: problemDetailsSchema };

/**
 * Rutas del almacenamiento: compone las dependencias del bloque (adapter
 * S3 y ping de base de datos → controller) y registra los endpoints bajo
 * el prefijo v1, con su esquema OpenAPI (entrada y respuestas).
 *
 * @remarks
 * GET /storage/download-url es público (URL prefirmada de 1 hora a quien
 * conozca la clave); el resto es administración con guard.
 */
const storageRoutes: FastifyPluginAsync = async app => {
  const db = DatabaseConnector.getPortfolioDb();
  const controller = new StorageController(new S3StorageAdapter(), async () => {
    const database = db.db;
    if (database === undefined) throw new Error('database connection not ready');
    await database.command({ ping: 1 });
  });

  app.get(
    '/storage/download-url',
    {
      schema: {
        tags: TAGS,
        summary: 'Obtener URL prefirmada de descarga',
        querystring: getDownloadUrlSchema,
        response: {
          200: downloadUrlResponseSchema,
          400: problemDetailsSchema,
          401: problemDetailsSchema,
          503: problemDetailsSchema,
        },
      },
    },
    controller.getDownloadUrl
  );

  app.post(
    '/admin/storage/upload-url',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Obtener URL prefirmada de subida',
        body: getUploadUrlSchema,
        response: {
          200: uploadUrlResponseSchema,
          400: problemDetailsSchema,
          503: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.getUploadUrl
  );

  app.get(
    '/admin/storage/objects',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Listar objetos del bucket',
        querystring: listObjectsSchema,
        response: {
          200: listObjectsResponseSchema,
          400: problemDetailsSchema,
          503: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.listObjects
  );

  app.get(
    '/admin/storage/objects/count',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Contar objetos bajo un prefijo',
        querystring: countObjectsSchema,
        response: {
          200: countObjectsResponseSchema,
          400: problemDetailsSchema,
          503: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.countObjects
  );

  app.post(
    '/admin/storage/objects/copy',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Copiar un objeto',
        body: copyObjectSchema,
        response: {
          400: problemDetailsSchema,
          503: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.copyObject
  );

  app.delete(
    '/admin/storage/objects',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Borrar un objeto',
        querystring: deleteObjectSchema,
        response: {
          400: problemDetailsSchema,
          503: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.deleteObject
  );

  app.post(
    '/admin/storage/objects/bulk-delete',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Borrado masivo de objetos',
        body: bulkDeleteSchema,
        response: {
          200: bulkDeleteResponseSchema,
          400: problemDetailsSchema,
          503: problemDetailsSchema,
          ...adminErrors,
        },
      },
    },
    controller.bulkDelete
  );

  app.post(
    '/admin/storage/notify-upload',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Notificar subida completada',
        body: notifyUploadSchema,
        response: { 400: problemDetailsSchema, ...adminErrors },
      },
    },
    controller.notifyUpload
  );

  app.get(
    '/admin/storage/health',
    {
      preHandler: adminGuard,
      schema: {
        tags: TAGS,
        summary: 'Estado del almacenamiento',
        response: { 200: storageHealthResponseSchema, ...adminErrors },
      },
    },
    controller.health
  );
};

/**
 * Módulo de rutas del almacenamiento que consume el bootstrap.
 */
export const storageRouteModule: RouteModule = {
  name: 'Storage',
  prefix: '',
  routes: storageRoutes,
};
