import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';

interface BlogItem {
  _id?: string;
  slug: string;
  title: string;
  locale: string;
  content?: string;
}

const FIXTURES = [
  { slug: 'lectura-fixture-es', locale: 'es' },
  { slug: 'lectura-fixture-en', locale: 'en' },
] as const;

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
 * literal heredado y 400 ante slugs no canónicos. La suite provisiona sus
 * propios posts fixture (uno por locale, publicados) y los retira al
 * terminar: no depende del contenido que haya en la base.
 */
describe('blog lecturas públicas', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };

  const removeFixture = async (slug: string, locale: string): Promise<void> => {
    const found = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/blog/${slug}?locale=${locale}`,
      headers,
    });
    if (found.statusCode !== 200) return;
    const leftover = found.json<BlogItem>();
    if (leftover._id !== undefined) {
      await app.inject({ method: 'DELETE', url: `/api/v1/admin/blog/${leftover._id}`, headers });
    }
  };

  const createPublishedFixture = async (slug: string, locale: string): Promise<void> => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/blog',
      headers,
      payload: {
        slug,
        title: `Fixture de lecturas ${locale}`,
        description: 'Post provisionado por la suite de lecturas públicas',
        content: `Contenido del fixture de lecturas públicas en ${locale}.`,
        date: '2026-08-15T00:00:00.000Z',
        locale,
      },
    });
    const id = created.json<BlogItem>()._id ?? '';
    await app.inject({ method: 'POST', url: `/api/v1/admin/blog/${id}/toggle-published`, headers });
  };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
    for (const fixture of FIXTURES) {
      await removeFixture(fixture.slug, fixture.locale);
      await createPublishedFixture(fixture.slug, fixture.locale);
    }
  });

  afterAll(async () => {
    for (const fixture of FIXTURES) {
      await removeFixture(fixture.slug, fixture.locale);
    }
    await closeTestApp(app);
  });

  it('lista sin locale los posts de ambos idiomas con proyección meta', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/blog', headers });
    expect(response.statusCode).toBe(200);
    const items = response.json<BlogItem[]>();
    expect(Array.isArray(items)).toBe(true);
    const slugs = items.map(item => item.slug);
    expect(slugs).toContain('lectura-fixture-es');
    expect(slugs).toContain('lectura-fixture-en');
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
    expect(slugs).toContain('lectura-fixture-es');
    expect(slugs).not.toContain('lectura-fixture-en');
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
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog/lectura-fixture-es',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const post = response.json<BlogItem>();
    expect(post.slug).toBe('lectura-fixture-es');
    expect(post.locale).toBe('es');
    expect(typeof post.content).toBe('string');
  });

  it('responde 404 Problem Details si el slug no existe en el locale pedido', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog/lectura-fixture-es?locale=en',
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
