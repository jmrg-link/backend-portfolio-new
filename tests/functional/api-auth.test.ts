import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';

/**
 * Pruebas funcionales del perímetro de la API privada: toda ruta exige un
 * token Clerk válido salvo el health check base; los rechazos son Problem
 * Details con el literal heredado y nunca 500.
 */
describe('perímetro de la API privada', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('el health check base responde sin token', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'backend-portfolio' });
  });

  it.each([
    '/api/v1/blog',
    '/api/v1/blog/hola-mundo',
    '/api/v1/projects',
    '/api/v1/projects/featured',
    '/api/v1/cms/site-settings',
    '/api/v1/cms/skills',
    '/api/v1/storage/download-url?key=x',
    '/api/v1/auth/me',
    '/api/v1/admin/blog',
    '/api/v1/admin/storage/objects',
    '/api/v1/admin/dashboard/recent-activity',
  ])('rechaza GET %s sin token con 401 Problem Details', async url => {
    const response = await app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 401, detail: 'No estas autenticado' });
  });

  it('rechaza un Bearer malformado con 401, nunca 500', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/blog',
      headers: { authorization: 'Bearer invalido.abc.def' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rechaza un JWT de firma inválida con 401, nunca 500', async () => {
    const encode = (value: object): string =>
      Buffer.from(JSON.stringify(value)).toString('base64url');
    const fakeJwt = `${encode({ alg: 'RS256', typ: 'JWT', kid: 'ins_x' })}.${encode({
      sub: 'user_123',
      exp: 9_999_999_999,
    })}.firma-falsa`;
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/blog',
      headers: { authorization: `Bearer ${fakeJwt}` },
    });
    expect(response.statusCode).toBe(401);
  });
});
