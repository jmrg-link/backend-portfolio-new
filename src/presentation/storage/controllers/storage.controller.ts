import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  BulkDeleteDto,
  CopyObjectDto,
  CountObjectsDto,
  DeleteObjectDto,
  GetDownloadUrlDto,
  GetUploadUrlDto,
  ListObjectsDto,
  NotifyUploadDto,
} from '@domain/dtos/storage';
import type { IStorageAdapter } from '@infrastructure/external-services/s3';
import { timeAdapter } from '@core/adapters/time.adapter';
import type { DatabasePing, StorageHealth } from './types';

/**
 * Frontera HTTP del almacenamiento: valida la entrada con los DTOs y
 * delega en el adapter S3 inyectado — el almacenamiento es un servicio
 * externo sin lógica de negocio propia, así que no hay capa de service.
 *
 * @remarks
 * Handlers como propiedades arrow para conservar `this` al registrarlos en
 * las rutas. Las mutaciones sin cuerpo de respuesta usan 204 (semántica
 * REST). notifyUpload señala la subida completada (PUT directo del navegador
 * a S3). Los errores los resuelve la cadena global — aquí no se capturan.
 */
export class StorageController {
  public constructor(
    private readonly storage: IStorageAdapter,
    private readonly pingDatabase: DatabasePing
  ) {}

  public readonly getDownloadUrl = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = GetDownloadUrlDto.fromRequest(request.query);
    const url = await this.storage.getDownloadUrl(dto.key);
    await reply.send({ url });
  };

  public readonly getUploadUrl = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = GetUploadUrlDto.fromRequest(request.body);
    const result = await this.storage.getUploadUrl(dto.key, dto.contentType);
    await reply.send(result);
  };

  public readonly listObjects = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = ListObjectsDto.fromRequest(request.query);
    const result = await this.storage.listObjects({
      prefix: dto.prefix,
      continuationToken: dto.continuationToken,
      maxKeys: dto.maxKeys,
    });
    await reply.send(result);
  };

  public readonly countObjects = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = CountObjectsDto.fromRequest(request.query);
    const result = await this.storage.countObjects(dto.prefix);
    await reply.send(result);
  };

  public readonly copyObject = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = CopyObjectDto.fromRequest(request.body);
    await this.storage.copyObject(dto.sourceKey, dto.destKey);
    await reply.status(204).send();
  };

  public readonly deleteObject = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = DeleteObjectDto.fromRequest(request.query);
    await this.storage.deleteObject(dto.key);
    await reply.status(204).send();
  };

  public readonly bulkDelete = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = BulkDeleteDto.fromRequest(request.body);
    const result = await this.storage.bulkDelete(dto.keys);
    await reply.send(result);
  };

  public readonly notifyUpload = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    NotifyUploadDto.fromRequest(request.body);
    await reply.status(204).send();
  };

  public readonly health = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const [s3Check, databaseCheck] = await Promise.allSettled([
      this.storage.healthCheck(),
      this.pingDatabase(),
    ]);
    const body: StorageHealth = {
      s3: s3Check.status === 'fulfilled' && s3Check.value,
      database: databaseCheck.status === 'fulfilled',
      timestamp: timeAdapter.nowISO(),
    };
    await reply.send(body);
  };
}
