import type { FastifyRequest } from 'fastify';
import type { InvitationEntity, UserEntity } from '@domain/entities/user';
import type {
  CreateUserData,
  InviteUserData,
  ListInvitationsOptions,
  ListUsersOptions,
  UpdateUserData,
} from '@domain/types/user';

/**
 * Tipos de token de Clerk aceptados por la API: sesión de usuario (panel
 * de administración), API key y token machine-to-machine (consumidores de
 * servicio como el frontend).
 */
export type ApiTokenType = 'session_token' | 'api_key' | 'm2m_token';

/**
 * Identidad verificada de la petición: tipo de token y usuario cuando el
 * token es de sesión (los tokens de máquina no representan a un usuario).
 */
export interface ApiCaller {
  tokenType: ApiTokenType;
  userId: string | null;
}

/**
 * Contrato de autenticación de la API: los guards dependen de esta
 * interfaz, nunca del proveedor concreto.
 */
export interface IAuthAdapter {
  resolveCaller(request: FastifyRequest): Promise<ApiCaller | null>;
  resolvePrimaryEmail(userId: string): Promise<string | null>;
}

/**
 * Página de resultados de la Backend API: elementos y total sin paginar.
 */
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}

/**
 * Contrato de gestión de usuarios sobre Clerk: el controller de
 * administración depende de esta interfaz, nunca del proveedor concreto.
 *
 * @remarks
 * Todas las operaciones traducen los errores del proveedor al vocabulario
 * de la cadena (`getUser` de un id inexistente lanza 404, un email duplicado
 * en `createUser` lanza 422); un fallo de red se responde como 502.
 *
 * @throws {EmmettError} con el status HTTP equivalente al error de Clerk.
 */
export interface IUserAdapter {
  listUsers(options: ListUsersOptions): Promise<PaginatedResult<UserEntity>>;
  countUsers(query?: string): Promise<number>;
  getUser(userId: string): Promise<UserEntity>;
  createUser(data: CreateUserData): Promise<UserEntity>;
  updateUser(userId: string, data: UpdateUserData): Promise<UserEntity>;
  deleteUser(userId: string): Promise<void>;
  listInvitations(options: ListInvitationsOptions): Promise<PaginatedResult<InvitationEntity>>;
  createInvitation(data: InviteUserData): Promise<InvitationEntity>;
  revokeInvitation(invitationId: string): Promise<InvitationEntity>;
}
