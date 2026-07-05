import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';

/**
 * Pruebas funcionales del perímetro del slice de usuarios: toda ruta de
 * administración exige un token Clerk válido; sin él responde 401 Problem
 * Details y nunca alcanza la Backend API de Clerk.
 */
describe('perímetro del slice de usuarios', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  const routes = [
    ['GET', '/api/v1/admin/users'],
    ['GET', '/api/v1/admin/users/count'],
    ['GET', '/api/v1/admin/users/user_x'],
    ['POST', '/api/v1/admin/users'],
    ['PATCH', '/api/v1/admin/users/user_x'],
    ['DELETE', '/api/v1/admin/users/user_x'],
    ['GET', '/api/v1/admin/users/invitations'],
    ['POST', '/api/v1/admin/users/invitations'],
    ['DELETE', '/api/v1/admin/users/invitations/inv_x'],
  ] as const;

  it.each(routes)('rechaza %s %s sin token con 401 Problem Details', async (method, url) => {
    const response = await app.inject({ method, url });
    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 401, detail: 'No estas autenticado' });
  });
});
