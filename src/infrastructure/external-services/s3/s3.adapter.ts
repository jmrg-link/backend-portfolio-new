import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EmmettError } from '@event-driven-io/emmett';
import { env } from '@config/envs';
import type {
  BulkDeleteResult,
  CountObjectsResult,
  IStorageAdapter,
  ListObjectsOptions,
  ListObjectsResult,
  PresignedUploadResult,
} from './types';

const UPLOAD_EXPIRES_SECONDS = 900;
const DOWNLOAD_EXPIRES_SECONDS = 3600;
const COUNT_PAGE_SIZE = 1000;

/**
 * Acceso al almacenamiento de objetos S3 compatible (OVH Object Storage):
 * URLs prefirmadas, listado, recuento, copia y borrado sobre el bucket de
 * `env.s3`.
 *
 * @remarks
 * El cliente se construye de forma perezosa en el primer uso y exige
 * `env.s3.isConfigured`; los errores del SDK suben a la cadena global (el
 * fallback responde 500 sin filtrar internals). La subida real la hace el
 * navegador con PUT directo a la URL prefirmada — el servidor nunca recibe
 * el binario.
 */
export class S3StorageAdapter implements IStorageAdapter {
  private client: S3Client | null = null;

  public async getUploadUrl(key: string, contentType: string): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket(),
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.getClient(), command, {
      expiresIn: UPLOAD_EXPIRES_SECONDS,
    });
    return { uploadUrl, key, expiresIn: UPLOAD_EXPIRES_SECONDS };
  }

  public async getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket(), Key: key });
    return getSignedUrl(this.getClient(), command, { expiresIn: DOWNLOAD_EXPIRES_SECONDS });
  }

  public async deleteObject(key: string): Promise<void> {
    await this.getClient().send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
  }

  /**
   * Borra cada clave de forma independiente y reporta el resultado
   * agregado; una clave fallida no aborta el resto.
   */
  public async bulkDelete(keys: string[]): Promise<BulkDeleteResult> {
    const results = await Promise.allSettled(keys.map(key => this.deleteObject(key)));
    const deleted = results.filter(result => result.status === 'fulfilled').length;
    return { deleted, failed: results.length - deleted, total: keys.length };
  }

  public async listObjects(options: ListObjectsOptions): Promise<ListObjectsResult> {
    const { prefix, continuationToken, maxKeys } = options;
    const response = await this.getClient().send(
      new ListObjectsV2Command({
        Bucket: this.bucket(),
        Prefix: prefix,
        MaxKeys: maxKeys,
        Delimiter: '/',
        ...(continuationToken !== undefined && { ContinuationToken: continuationToken }),
      })
    );

    const objects = (response.Contents ?? [])
      .filter(object => object.Key !== prefix)
      .map(object => ({
        key: object.Key ?? '',
        size: object.Size ?? 0,
        lastModified: object.LastModified ?? new Date(),
      }));
    const folders = (response.CommonPrefixes ?? []).map(common => common.Prefix ?? '');

    return {
      objects,
      folders,
      ...(response.NextContinuationToken !== undefined && {
        nextToken: response.NextContinuationToken,
      }),
      prefix,
    };
  }

  /**
   * Recorre todas las páginas bajo el prefijo (sin Delimiter) sumando
   * objetos y bytes: el total real aunque la UI solo pinte una página.
   */
  public async countObjects(prefix: string): Promise<CountObjectsResult> {
    let totalObjects = 0;
    let totalBytes = 0;
    let continuationToken: string | undefined;

    do {
      const response = await this.getClient().send(
        new ListObjectsV2Command({
          Bucket: this.bucket(),
          Prefix: prefix,
          MaxKeys: COUNT_PAGE_SIZE,
          ...(continuationToken !== undefined && { ContinuationToken: continuationToken }),
        })
      );
      for (const object of response.Contents ?? []) {
        if (object.Key !== undefined && object.Key !== prefix) {
          totalObjects += 1;
          totalBytes += object.Size ?? 0;
        }
      }
      continuationToken =
        response.IsTruncated === true ? response.NextContinuationToken : undefined;
    } while (continuationToken !== undefined);

    return { prefix, totalObjects, totalBytes };
  }

  public async copyObject(sourceKey: string, destKey: string): Promise<void> {
    const bucket = this.bucket();
    await this.getClient().send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${sourceKey}`,
        Key: destKey,
      })
    );
  }

  /**
   * Comprueba la accesibilidad del bucket; nunca lanza — un fallo del
   * proveedor se reporta como false en el health del slice.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.getClient().send(new HeadBucketCommand({ Bucket: this.bucket() }));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construye perezosamente el cliente S3 y lo memoiza en la instancia.
   *
   * @throws {EmmettError} 503 si el entorno no define bucket S3
   * (env.s3.isConfigured) — la cadena lo responde como Service Unavailable.
   */
  private getClient(): S3Client {
    if (this.client !== null) return this.client;
    if (!env.s3.isConfigured) {
      throw new EmmettError({ errorCode: 503, message: 'S3 storage is not configured' });
    }
    this.client = new S3Client({
      region: env.s3.region,
      forcePathStyle: env.s3.forcePathStyle,
      ...(env.s3.endpoint !== undefined && { endpoint: env.s3.endpoint }),
      ...(env.s3.accessKeyId !== undefined &&
        env.s3.secretAccessKey !== undefined && {
          credentials: {
            accessKeyId: env.s3.accessKeyId,
            secretAccessKey: env.s3.secretAccessKey,
          },
        }),
    });
    return this.client;
  }

  private bucket(): string {
    return env.s3.bucket ?? '';
  }
}
