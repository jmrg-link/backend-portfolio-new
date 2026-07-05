import { createClerkClient } from '@clerk/fastify';
import { EmmettError } from '@event-driven-io/emmett';
import { env } from '@config/envs';
import { InvitationEntity, UserEntity } from '@domain/entities/user';
import type {
  CreateUserData,
  InviteUserData,
  ListInvitationsOptions,
  ListUsersOptions,
  UpdateUserData,
} from '@domain/types/user';
import type { IUserAdapter, PaginatedResult } from './types';

type ClerkClient = ReturnType<typeof createClerkClient>;
type ClerkUser = Awaited<ReturnType<ClerkClient['users']['getUser']>>;
type ClerkInvitation = Awaited<ReturnType<ClerkClient['invitations']['createInvitation']>>;

const PROVIDER_ERROR_CODE = 502;

/**
 * Gestión de usuarios sobre la Backend API de Clerk: alta administrativa,
 * consulta, actualización, borrado e invitaciones. La librería del
 * proveedor solo se importa en este adapter.
 *
 * @remarks
 * Cada operación traduce los errores de Clerk al vocabulario de la cadena:
 * un error de la API con status 4xx conserva ese código; cualquier otro
 * fallo (red, 5xx) se responde como 502. Las entidades de salida omiten la
 * metadata privada y las credenciales.
 */
export class ClerkUserAdapter implements IUserAdapter {
  private readonly client = createClerkClient({
    secretKey: env.clerk.secretKey,
    publishableKey: env.clerk.publishableKey,
    ...(env.clerk.publicKey !== undefined && { jwtKey: env.clerk.publicKey }),
  });

  public async listUsers(options: ListUsersOptions): Promise<PaginatedResult<UserEntity>> {
    const page = await this.run(() =>
      this.client.users.getUserList({
        ...(options.limit !== undefined && { limit: options.limit }),
        ...(options.offset !== undefined && { offset: options.offset }),
        ...(options.query !== undefined && { query: options.query }),
      })
    );
    return { data: page.data.map(user => ClerkUserAdapter.toUser(user)), totalCount: page.totalCount };
  }

  public async countUsers(query?: string): Promise<number> {
    return this.run(() => this.client.users.getCount({ ...(query !== undefined && { query }) }));
  }

  public async getUser(userId: string): Promise<UserEntity> {
    const user = await this.run(() => this.client.users.getUser(userId));
    return ClerkUserAdapter.toUser(user);
  }

  public async createUser(data: CreateUserData): Promise<UserEntity> {
    const user = await this.run(() =>
      this.client.users.createUser({
        emailAddress: [data.emailAddress],
        ...(data.password !== undefined && { password: data.password }),
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.publicMetadata !== undefined && { publicMetadata: data.publicMetadata }),
      })
    );
    return ClerkUserAdapter.toUser(user);
  }

  public async updateUser(userId: string, data: UpdateUserData): Promise<UserEntity> {
    const profile = {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.username !== undefined && { username: data.username }),
    };
    if (Object.keys(profile).length > 0) {
      await this.run(() => this.client.users.updateUser(userId, profile));
    }
    if (data.publicMetadata !== undefined) {
      const publicMetadata = data.publicMetadata;
      await this.run(() => this.client.users.updateUserMetadata(userId, { publicMetadata }));
    }
    const user = await this.run(() => this.client.users.getUser(userId));
    return ClerkUserAdapter.toUser(user);
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.run(() => this.client.users.deleteUser(userId));
  }

  public async listInvitations(
    options: ListInvitationsOptions
  ): Promise<PaginatedResult<InvitationEntity>> {
    const page = await this.run(() =>
      this.client.invitations.getInvitationList({
        ...(options.limit !== undefined && { limit: options.limit }),
        ...(options.offset !== undefined && { offset: options.offset }),
        ...(options.status !== undefined && { status: options.status }),
      })
    );
    return {
      data: page.data.map(invitation => ClerkUserAdapter.toInvitation(invitation)),
      totalCount: page.totalCount,
    };
  }

  public async createInvitation(data: InviteUserData): Promise<InvitationEntity> {
    const invitation = await this.run(() =>
      this.client.invitations.createInvitation({
        emailAddress: data.emailAddress,
        ...(data.redirectUrl !== undefined && { redirectUrl: data.redirectUrl }),
        ...(data.publicMetadata !== undefined && { publicMetadata: data.publicMetadata }),
        ...(data.expiresInDays !== undefined && { expiresInDays: data.expiresInDays }),
      })
    );
    return ClerkUserAdapter.toInvitation(invitation);
  }

  public async revokeInvitation(invitationId: string): Promise<InvitationEntity> {
    const invitation = await this.run(() =>
      this.client.invitations.revokeInvitation(invitationId)
    );
    return ClerkUserAdapter.toInvitation(invitation);
  }

  /**
   * Ejecuta una llamada a la Backend API traduciendo cualquier fallo al
   * vocabulario de la cadena de errores.
   *
   * @throws {EmmettError} con el status del error de Clerk (4xx) o 502.
   */
  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw ClerkUserAdapter.toDomainError(error);
    }
  }

  /**
   * Traduce el error opaco de la Backend API a un error de dominio.
   *
   * @remarks
   * Un error con status HTTP 4xx conserva ese código; el resto se responde
   * como 502 (fallo del proveedor).
   */
  private static toDomainError(error: unknown): EmmettError {
    const status = ClerkUserAdapter.statusOf(error);
    return new EmmettError({ errorCode: status, message: ClerkUserAdapter.messageOf(error) });
  }

  private static statusOf(error: unknown): number {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = error.status;
      if (typeof status === 'number' && status >= 400 && status < 500) return status;
    }
    return PROVIDER_ERROR_CODE;
  }

  /**
   * Primer mensaje de negocio del error de Clerk, o un texto genérico.
   *
   * @remarks
   * El cast estrecha el primer elemento a la forma con `message`: los
   * elementos del array de errores no están tipados tras el guard.
   */
  private static messageOf(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'errors' in error) {
      const errors = error.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0] as { message?: unknown };
        if (typeof first.message === 'string') return first.message;
      }
    }
    return 'Clerk request failed';
  }

  private static toUser(user: ClerkUser): UserEntity {
    return new UserEntity({
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      banned: user.banned,
      locked: user.locked,
      publicMetadata: user.publicMetadata,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
    });
  }

  private static toInvitation(invitation: ClerkInvitation): InvitationEntity {
    return new InvitationEntity({
      id: invitation.id,
      email: invitation.emailAddress,
      status: invitation.status,
      url: invitation.url ?? null,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    });
  }
}
