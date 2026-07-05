import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';

const ADMIN_EMAIL = 'info@jmrg.dev';
const DISPOSABLE_EMAIL = 'test-e2e@example.com';
const INVITE_EMAIL = 'test-invite@example.com';

interface UserBody {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  publicMetadata: Record<string, unknown>;
}

interface UserPage {
  data: UserBody[];
  totalCount: number;
}

interface InvitationBody {
  id: string;
  email: string;
  status: string;
}

interface InvitationPage {
  data: InvitationBody[];
  totalCount: number;
}

/**
 * Pruebas de extremo a extremo de la gestión de usuarios contra la
 * instancia de desarrollo de Clerk: listado, recuento y consulta del
 * administrador, ciclo completo de un usuario desechable (alta,
 * actualización parcial con metadata, borrado) y contrato de invitaciones,
 * con limpieza de restos antes y después. El perímetro 401 del slice vive
 * en users.test.ts.
 *
 * @remarks
 * La instancia tiene el registro cerrado sin email como identificador, así
 * que Clerk rechaza emitir CUALQUIER invitación (400 'Invitations are only
 * supported on instances that accept email addresses') sea cual sea el
 * dominio; la suite asserta ese comportamiento real y el envelope vacío del
 * listado.
 */
describe('users e2e contra Clerk', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };
  let adminId: string;
  let createdUserId: string;

  const removeDisposableUsers = async (): Promise<void> => {
    const found = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users?query=test-e2e',
      headers,
    });
    if (found.statusCode !== 200) return;
    for (const user of found.json<UserPage>().data) {
      await app.inject({ method: 'DELETE', url: `/api/v1/admin/users/${user.id}`, headers });
    }
  };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
    await removeDisposableUsers();
  });

  afterAll(async () => {
    await removeDisposableUsers();
    await closeTestApp(app);
  });

  it('lista los usuarios con el envelope de Clerk e incluye al administrador', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers });
    expect(response.statusCode).toBe(200);
    const page = response.json<UserPage>();
    expect(Array.isArray(page.data)).toBe(true);
    expect(page.totalCount).toBeGreaterThanOrEqual(1);
    const admin = page.data.find(user => user.email === ADMIN_EMAIL);
    expect(admin).toBeDefined();
    adminId = admin?.id ?? '';
  });

  it('cuenta los usuarios con al menos el administrador', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/admin/users/count', headers });
    expect(response.statusCode).toBe(200);
    expect(response.json<{ totalCount: number }>().totalCount).toBeGreaterThanOrEqual(1);
  });

  it('devuelve al administrador por id con su email', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/users/${adminId}`,
      headers,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<UserBody>().email).toBe(ADMIN_EMAIL);
  });

  it('responde 404 Problem Details ante un id de usuario inexistente', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users/user_inexistente0000',
      headers,
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 404 });
  });

  it('rechaza un alta con email inválido con 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers,
      payload: { emailAddress: 'no-es-un-email' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });

  it('crea un usuario desechable con 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users',
      headers,
      payload: {
        emailAddress: DISPOSABLE_EMAIL,
        password: 'Str0ng-Passw0rd-Test-2026!',
        firstName: 'Test',
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json<UserBody>();
    expect(body.id).toBeDefined();
    expect(body.email).toBe(DISPOSABLE_EMAIL);
    expect(body.firstName).toBe('Test');
    createdUserId = body.id;
  });

  it('actualiza el apellido y la metadata pública del desechable', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/users/${createdUserId}`,
      headers,
      payload: { lastName: 'E2E', publicMetadata: { role: 'tester' } },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<UserBody>();
    expect(body.lastName).toBe('E2E');
    expect(body.publicMetadata['role']).toBe('tester');
  });

  it('borra el usuario desechable con 204 y deja de existir', async () => {
    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/v1/admin/users/${createdUserId}`,
      headers,
    });
    expect(removed.statusCode).toBe(204);

    const gone = await app.inject({
      method: 'GET',
      url: `/api/v1/admin/users/${createdUserId}`,
      headers,
    });
    expect(gone.statusCode).toBe(404);
  });

  it('la instancia con registro cerrado rechaza emitir invitaciones con 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users/invitations',
      headers,
      payload: { emailAddress: INVITE_EMAIL, expiresInDays: 1 },
    });
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json<{ status: number; detail: string }>().detail).toContain(
      'Invitations are only supported'
    );
  });

  it('lista las invitaciones con el envelope de Clerk', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/users/invitations',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const page = response.json<InvitationPage>();
    expect(Array.isArray(page.data)).toBe(true);
    expect(page.totalCount).toBeGreaterThanOrEqual(0);
    expect(page.data.every(invitation => typeof invitation.id === 'string')).toBe(true);
  });

  it('responde 404 Problem Details al revocar una invitación inexistente', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/v1/admin/users/invitations/inv_inexistente0000',
      headers,
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.json()).toMatchObject({ status: 404 });
  });

  it('rechaza una invitación con email inválido con 400', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/users/invitations',
      headers,
      payload: { emailAddress: 'no-es-un-email' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ status: 400 });
  });
});
