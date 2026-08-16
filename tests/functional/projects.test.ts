import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';
import { collectPaginatedIds } from '../helpers/pagination';

interface ProjectItem {
  slug: string;
  title: string;
  locale: string;
  published: boolean;
  featured: boolean;
  content?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  countTotal: number;
  nextPage: boolean;
  previousPage: boolean;
}

interface PaginatedProjects {
  data: ProjectItem[];
  meta: PaginationMeta;
}

/**
 * Pruebas funcionales de las lecturas públicas de proyectos contra la
 * MongoDB local: listado sin locale con ambos idiomas y proyección meta
 * (sin `content`), filtro por locale, paginación opt-in, destacados solo
 * publicados, lectura por slug con content y los 404 y 400 de frontera con
 * el literal heredado.
 */
describe('projects lecturas públicas', () => {
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

  it('pagina el listado de servicio sin duplicar ni omitir proyectos', async () => {
    const full = await app.inject({ method: 'GET', url: '/api/v1/projects', headers });
    const total = full.json<ProjectItem[]>().length;
    const ids = await collectPaginatedIds(app, '/api/v1/projects', 2, headers);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(total);
  });

  it('lista sin locale los proyectos de ambos idiomas con proyección meta', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/projects', headers });
    expect(response.statusCode).toBe(200);
    const items = response.json<ProjectItem[]>();
    expect(Array.isArray(items)).toBe(true);
    expect(items.map(item => item.slug)).toContain('pokedex-next');
    const locales = new Set(items.map(item => item.locale));
    expect(locales.size).toBeGreaterThanOrEqual(2);
    for (const item of items) {
      expect(item).not.toHaveProperty('content');
    }
  });

  it('filtra por locale es todos los proyectos del listado', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?locale=es',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const items = response.json<ProjectItem[]>();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(item => item.locale === 'es')).toBe(true);
  });

  it('devuelve el envelope paginado al pedir page y limit', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?page=1&limit=2',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<PaginatedProjects>();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta).toMatchObject({ page: 1, limit: 2, previousPage: false });
    expect(typeof body.meta.countTotal).toBe('number');
    expect(typeof body.meta.nextPage).toBe('boolean');
  });

  it('lista destacados solo con proyectos publicados y featured', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/projects/featured', headers });
    expect(response.statusCode).toBe(200);
    const items = response.json<ProjectItem[]>();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every(item => item.featured)).toBe(true);
    expect(items.every(item => item.published === undefined)).toBe(true);
  });

  it('lee un proyecto por slug con content presente', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/pokedex-next',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const project = response.json<ProjectItem>();
    expect(project.slug).toBe('pokedex-next');
    expect(typeof project.content).toBe('string');
  });

  it('responde 404 Problem Details ante un slug inexistente', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/projects/slug-inexistente',
      headers,
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 404, detail: 'Proyecto no encontrado' });
  });

  it('rechaza con 400 un slug no canónico', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/projects/${encodeURIComponent('No Canonico')}`,
      headers,
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });
});
