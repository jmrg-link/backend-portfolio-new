import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';

interface BlogItem {
  slug: string;
  title: string;
  locale: string;
  content?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  countTotal: number;
  nextPage: boolean;
  previousPage: boolean;
}

interface PaginatedBlog {
  data: BlogItem[];
  meta: PaginationMeta;
}

/**
 * Pruebas funcionales de las lecturas públicas del blog contra la MongoDB
 * local: listado sin locale con ambos idiomas y proyección meta (sin
 * `content`), filtro por locale, paginación opt-in con clamps silenciosos,
 * lectura por slug con locale por defecto, 404 Problem Details con el
 * literal heredado y 400 ante slugs no canónicos.
 */
describe('blog lecturas públicas', () => {
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

  it('lista sin locale los posts de ambos idiomas con proyección meta', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/blog', headers });
    expect(response.statusCode).toBe(200);
    const items = response.json<BlogItem[]>();
    expect(Array.isArray(items)).toBe(true);
    const slugs = items.map(item => item.slug);
    expect(slugs).toContain('hola-mundo');
    expect(slugs).toContain('hello-world');
    for (const item of items) {
      expect(item).not.toHaveProperty('content');
      expect(typeof item.slug).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.locale).toBe('string');
    }
  });

  it('filtra por locale es y deja fuera los posts en inglés', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/blog?locale=es', headers });
    expect(response.statusCode).toBe(200);
    const items = response.json<BlogItem[]>();
    expect(items.every(item => item.locale === 'es')).toBe(true);
    const slugs = items.map(item => item.slug);
    expect(slugs).toContain('hola-mundo');
    expect(slugs).not.toContain('hello-world');
  });

  it('devuelve el envelope paginado al pedir page y limit', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog?page=1&limit=1',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<PaginatedBlog>();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(1);
    expect(body.meta).toMatchObject({ page: 1, limit: 1, previousPage: false });
    expect(typeof body.meta.countTotal).toBe('number');
    expect(typeof body.meta.nextPage).toBe('boolean');
  });

  it('acota en silencio una página negativa y un límite desorbitado', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog?page=-5&limit=9999',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<PaginatedBlog>();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(100);
  });

  it('lee un post por slug con locale es por defecto y con content', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/blog/hola-mundo', headers });
    expect(response.statusCode).toBe(200);
    const post = response.json<BlogItem>();
    expect(post.slug).toBe('hola-mundo');
    expect(post.locale).toBe('es');
    expect(typeof post.content).toBe('string');
  });

  it('responde 404 Problem Details si el slug no existe en el locale pedido', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog/hola-mundo?locale=en',
      headers,
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 404, detail: 'Post no encontrado' });
  });

  it('responde 404 ante un slug inexistente', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog/slug-inexistente',
      headers,
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ status: 404, detail: 'Post no encontrado' });
  });

  it('rechaza con 400 un slug no canónico', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/blog/${encodeURIComponent('Hola Mundo')}`,
      headers,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });
});
