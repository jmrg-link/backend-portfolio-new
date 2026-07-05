import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';

interface ActivityItem {
  type: 'post' | 'project';
  slug: string;
  title: string;
  locale: string;
  date: string;
  published: boolean;
}

interface MeBody {
  tokenType: string;
  userId: string | null;
  email: string | null;
}

interface DevTokenBody {
  token: string;
  expiresInSeconds: number;
  userId: string;
  email: string | null;
}

/**
 * Pruebas funcionales del dashboard de administración y de la identidad de
 * la petición contra la MongoDB local: timeline de actividad reciente
 * ordenado por última modificación, identidad del token de sesión y emisión
 * del token de desarrollo.
 */
describe('dashboard y auth', () => {
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

  it('la actividad reciente mezcla posts y proyectos por fecha descendente con tope 10', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/recent-activity',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const items = response.json<ActivityItem[]>();
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(10);
    expect(items.every(item => item.type === 'post' || item.type === 'project')).toBe(true);
    expect(items.every(item => typeof item.slug === 'string' && item.slug.length > 0)).toBe(true);
    expect(items.every(item => typeof item.title === 'string' && item.title.length > 0)).toBe(true);
    expect(items.every(item => typeof item.date === 'string')).toBe(true);

    const timestamps = items.map(item => new Date(item.date).getTime());
    const descending = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(descending);
  });

  it('auth/me representa la identidad del token de sesión del administrador', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers });
    expect(response.statusCode).toBe(200);
    const body = response.json<MeBody>();
    expect(body.tokenType).toBe('session_token');
    expect(typeof body.userId).toBe('string');
    expect(body.email).toBe('info@jmrg.dev');
  });

  it('auth/dev-token emite un token de sesión sin exigir autenticación', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/auth/dev-token' });
    expect(response.statusCode).toBe(200);
    const body = response.json<DevTokenBody>();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    expect(body.expiresInSeconds).toBe(3600);
    expect(typeof body.userId).toBe('string');
    expect(body).toHaveProperty('email');
  });

  it('la actividad reciente sin token responde 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard/recent-activity',
    });
    expect(response.statusCode).toBe(401);
  });
});
