import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { env } from '@config/envs';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';

const S3_UNAVAILABLE = 'S3 storage is not configured';
const s3Configured = env.s3.isConfigured;

interface BulkDeleteBody {
  deleted: number;
  failed: number;
  total: number;
}

interface StorageHealthBody {
  s3: boolean;
  database: boolean;
  timestamp: string;
}

interface ListObjectsBody {
  objects: Array<{ key: string; size: number; lastModified: string }>;
  folders: string[];
  nextToken?: string;
  prefix?: string;
}

interface CountObjectsBody {
  prefix: string;
  totalObjects: number;
  totalBytes: number;
}

interface UploadUrlBody {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Validación de entrada del slice de almacenamiento: los 400 de los DTOs y
 * el 204 de notify-upload no tocan el bucket, así que aplican con y sin S3
 * configurado.
 */
describe('storage: validación de entrada', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('la URL de descarga sin clave responde 400', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/storage/download-url',
      headers,
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('rechaza una URL de subida con MIME fuera de la allowlist con 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/upload-url',
      headers,
      payload: { key: 'blog/test.pdf', contentType: 'application/pdf' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('rechaza una copia sin clave de destino con 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/objects/copy',
      headers,
      payload: { sourceKey: 'blog/a.png' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('rechaza un borrado sin clave con 400', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/admin/storage/objects',
      headers,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('rechaza un borrado masivo con más de 20 claves con 400', async () => {
    const keys = Array.from({ length: 21 }, (_, i) => `blog/obsoleto-${i}.png`);
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/objects/bulk-delete',
      headers,
      payload: { keys },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('la notificación de subida válida responde 204 sin tocar S3', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/notify-upload',
      headers,
      payload: { key: 'blog/test.png' },
    });
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });

  it('rechaza una notificación de subida sin clave con 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/notify-upload',
      headers,
      payload: {},
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });
});

/**
 * Contrato del slice cuando el entorno no define bucket S3: toda operación
 * que toca el bucket responde 503 Problem Details, el borrado masivo agrega
 * los fallos por clave sin abortar y el health reporta el bucket caído con
 * la base de datos viva.
 */
describe.skipIf(s3Configured)('storage sin S3 configurado', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('la URL de descarga con clave responde 503 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/storage/download-url?key=blog/x.png',
      headers,
    });
    expect(response.statusCode).toBe(503);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 503, detail: S3_UNAVAILABLE });
  });

  it('la URL de subida con MIME válido responde 503 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/upload-url',
      headers,
      payload: { key: 'blog/test.png', contentType: 'image/png' },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 503, detail: S3_UNAVAILABLE });
  });

  it('el listado de objetos responde 503 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects',
      headers,
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 503, detail: S3_UNAVAILABLE });
  });

  it('el recuento de objetos responde 503 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects/count',
      headers,
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 503, detail: S3_UNAVAILABLE });
  });

  it('la copia válida responde 503 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/objects/copy',
      headers,
      payload: { sourceKey: 'blog/a.png', destKey: 'blog/b.png' },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 503, detail: S3_UNAVAILABLE });
  });

  it('el borrado con clave responde 503 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/admin/storage/objects?key=blog/x.png',
      headers,
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ status: 503, detail: S3_UNAVAILABLE });
  });

  it('el borrado masivo agrega los fallos por clave con 200 al no haber bucket', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/objects/bulk-delete',
      headers,
      payload: { keys: ['blog/a.png', 'blog/b.png'] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<BulkDeleteBody>()).toEqual({ deleted: 0, failed: 2, total: 2 });
  });

  it('el health reporta s3 caído y la base de datos viva con 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/health',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<StorageHealthBody>();
    expect(body.s3).toBe(false);
    expect(body.database).toBe(true);
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });
});

/**
 * Contrato del slice contra el bucket S3 real del entorno, en régimen de
 * SOLO LECTURA: el bucket contiene los objetos reales del portfolio, así
 * que la suite se limita a health, listados, recuentos y URLs prefirmadas
 * (la firma es local y no crea ni borra objetos).
 */
describe.skipIf(!s3Configured)('storage con S3 real (solo lectura)', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('el health reporta s3 y base de datos vivos con 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/health',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<StorageHealthBody>();
    expect(body.s3).toBe(true);
    expect(body.database).toBe(true);
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  it('el recuento recorre el bucket completo y suma bytes reales', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects/count',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<CountObjectsBody>();
    expect(body.totalObjects).toBeGreaterThan(0);
    expect(body.totalBytes).toBeGreaterThan(0);
  });

  it('el listado devuelve objetos con clave, tamaño y fecha, y respeta maxKeys', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects?prefix=blog/&maxKeys=2',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<ListObjectsBody>();
    expect(body.objects.length).toBeLessThanOrEqual(2);
    expect(body.prefix).toBe('blog/');
    for (const object of body.objects) {
      expect(object.key.startsWith('blog/')).toBe(true);
      expect(object.size).toBeGreaterThanOrEqual(0);
      expect(new Date(object.lastModified).getTime()).not.toBeNaN();
    }
    expect(Array.isArray(body.folders)).toBe(true);
  });

  it('el listado pagina con nextToken cuando hay más objetos que maxKeys', async () => {
    const count = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects/count',
      headers,
    });
    const { totalObjects } = count.json<CountObjectsBody>();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects?maxKeys=1',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<ListObjectsBody>();
    if (totalObjects > 1) {
      expect(typeof body.nextToken).toBe('string');
    }
  });

  it('la URL de descarga prefirmada de un objeto real descarga sus bytes', async () => {
    const listed = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/storage/objects?prefix=blog/&maxKeys=1',
      headers,
    });
    const first = listed.json<ListObjectsBody>().objects[0];
    expect(first).toBeDefined();
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/storage/download-url?key=${encodeURIComponent(first?.key ?? '')}`,
      headers,
    });
    expect(response.statusCode).toBe(200);
    const { url } = response.json<{ url: string }>();
    expect(url).toContain(env.s3.bucket ?? '');
    const remote = await fetch(url);
    expect(remote.status).toBe(200);
    expect(Number(remote.headers.get('content-length'))).toBe(first?.size ?? -1);
    await remote.arrayBuffer();
  });

  it('la URL de subida con MIME válido se prefirma sin crear el objeto', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/storage/upload-url',
      headers,
      payload: { key: 'blog/test-presign.png', contentType: 'image/png' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<UploadUrlBody>();
    expect(body.uploadUrl).toContain(env.s3.bucket ?? '');
    expect(body.key).toBe('blog/test-presign.png');
    expect(body.expiresIn).toBe(900);
  });
});
