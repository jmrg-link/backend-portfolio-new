import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';

const SLUG = 'test-e2e-crud';
const LOCALE = 'es';

interface PostBody {
  _id?: string;
  slug: string;
  title: string;
  published: boolean;
  featured: boolean;
  tags: string[];
  author: string;
  readingTime?: number | null;
}

/**
 * Pruebas funcionales del CRUD de administración del blog contra la
 * MongoDB local: creación con defaults y readingTime de servidor,
 * duplicados por índice único, actualización parcial con campos
 * inmutables, toggle de publicación y borrado.
 */
describe('blog admin CRUD', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };
  let createdId: string;

  const removeLeftover = async (): Promise<void> => {
    const found = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/blog/${SLUG}?locale=${LOCALE}`,
      headers,
    });
    if (found.statusCode !== 200) return;
    const leftover = found.json<PostBody>();
    if (leftover._id !== undefined) {
      await app.inject({ method: 'DELETE', url: `/api/v1/admin/blog/${leftover._id}`, headers });
    }
  };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
    await removeLeftover();
  });

  afterAll(async () => {
    await removeLeftover();
    await closeTestApp(app);
  });

  it('crea un post con defaults del servidor y readingTime calculado', async () => {
    const content = Array.from({ length: 401 }, (_, i) => `palabra${i}`).join(' ');
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/blog',
      headers,
      payload: {
        slug: SLUG,
        title: 'Post de prueba e2e',
        description: 'Cobertura del CRUD de administración',
        content,
        date: '2026-07-05T00:00:00.000Z',
        locale: LOCALE,
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json<PostBody>();
    expect(body._id).toBeDefined();
    expect(response.headers.location).toBe(`/api/v1/admin/blog/${body._id ?? ''}`);
    expect(body.published).toBe(false);
    expect(body.featured).toBe(false);
    expect(body.tags).toEqual([]);
    expect(body.author).toBe('JMRG');
    expect(body.readingTime).toBe(3);
    createdId = body._id ?? '';
  });

  it('rechaza un slug duplicado en el mismo locale con 409', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/blog',
      headers,
      payload: {
        slug: SLUG,
        title: 'Duplicado',
        description: 'Debe chocar con el índice único',
        content: 'contenido duplicado',
        date: '2026-07-05T00:00:00.000Z',
        locale: LOCALE,
      },
    });
    expect(response.statusCode).toBe(409);
    expect(response.headers['content-type']).toContain('application/problem+json');
  });

  it('rechaza un body inválido con 400 y errors[]', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/blog',
      headers,
      payload: { slug: 'sin-titulo' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('rechaza un body con JSON malformado con 400, nunca 500', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/blog',
      headers: { ...headers, 'content-type': 'application/json' },
      payload: '{esto no es json',
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('el listado de administración incluye el borrador y el de servicio no', async () => {
    const admin = await app.inject({ method: 'GET', url: '/api/v1/admin/blog', headers });
    expect(admin.statusCode).toBe(200);
    const adminSlugs = admin.json<PostBody[]>().map(post => post.slug);
    expect(adminSlugs).toContain(SLUG);

    const published = await app.inject({ method: 'GET', url: '/api/v1/blog', headers });
    const publicSlugs = published.json<PostBody[]>().map(post => post.slug);
    expect(publicSlugs).not.toContain(SLUG);
  });

  it('la lectura de administración por slug devuelve el borrador', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/blog/${SLUG}?locale=${LOCALE}`,
      headers,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<PostBody>().slug).toBe(SLUG);
  });

  it('actualiza el título sin tocar el slug aunque el body lo intente', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/blog/${createdId}`,
      headers,
      payload: { title: 'Título actualizado', slug: 'slug-hackeado' },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<PostBody>();
    expect(body.title).toBe('Título actualizado');
    expect(body.slug).toBe(SLUG);
    expect(body.readingTime).toBe(3);
  });

  it('recalcula readingTime solo cuando cambia el contenido', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/blog/${createdId}`,
      headers,
      payload: { content: 'contenido corto de una línea' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<PostBody>().readingTime).toBe(1);
  });

  it('responde 404 al actualizar un id inexistente', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/admin/blog/aaaaaaaaaaaaaaaaaaaaaaaa',
      headers,
      payload: { title: 'nadie' },
    });
    expect(response.statusCode).toBe(404);
  });

  it('responde 400 ante un id que no es ObjectId', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/admin/blog/no-es-un-id',
      headers,
      payload: { title: 'nadie' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('el toggle publica el borrador y lo expone en las lecturas de servicio', async () => {
    const toggled = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/blog/${createdId}/toggle-published`,
      headers,
    });
    expect(toggled.statusCode).toBe(200);
    expect(toggled.json<PostBody>().published).toBe(true);

    const publicRead = await app.inject({
      method: 'GET',
      url: `/api/v1/blog/${SLUG}?locale=${LOCALE}`,
      headers,
    });
    expect(publicRead.statusCode).toBe(200);

    const back = await app.inject({
      method: 'POST',
      url: `/api/v1/admin/blog/${createdId}/toggle-published`,
      headers,
    });
    expect(back.json<PostBody>().published).toBe(false);
  });

  it('responde 404 en el toggle de un id inexistente', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/blog/aaaaaaaaaaaaaaaaaaaaaaaa/toggle-published',
      headers,
    });
    expect(response.statusCode).toBe(404);
  });

  it('borra el post con 204 y las lecturas posteriores devuelven 404', async () => {
    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/blog/${createdId}`,
      headers,
    });
    expect(removed.statusCode).toBe(204);

    const gone = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/blog/${SLUG}?locale=${LOCALE}`,
      headers,
    });
    expect(gone.statusCode).toBe(404);

    const again = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/blog/${createdId}`,
      headers,
    });
    expect(again.statusCode).toBe(404);
  });
});
