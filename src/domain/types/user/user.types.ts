/**
 * Datos de alta administrativa de un usuario: email obligatorio y perfil
 * opcional. `publicMetadata` admite datos no sensibles como el rol.
 */
export interface CreateUserData {
  emailAddress: string;
  password?: string | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  username?: string | undefined;
  publicMetadata?: Record<string, unknown> | undefined;
}

/**
 * Cambio parcial de un usuario: solo los campos presentes se actualizan. El
 * email no es editable por esta vía (lo gestiona el flujo del usuario).
 */
export interface UpdateUserData {
  firstName?: string | undefined;
  lastName?: string | undefined;
  username?: string | undefined;
  publicMetadata?: Record<string, unknown> | undefined;
}

/**
 * Opciones del listado paginado de usuarios.
 *
 * @remarks
 * Ordena por `-created_at` (más recientes primero). `query` busca por email,
 * nombre o identificadores.
 */
export interface ListUsersOptions {
  limit?: number | undefined;
  offset?: number | undefined;
  query?: string | undefined;
}

/**
 * Datos de una invitación de alta: email obligatorio y opciones de entrega.
 */
export interface InviteUserData {
  emailAddress: string;
  redirectUrl?: string | undefined;
  publicMetadata?: Record<string, unknown> | undefined;
  expiresInDays?: number | undefined;
}

/**
 * Opciones del listado paginado de invitaciones.
 */
export interface ListInvitationsOptions {
  limit?: number | undefined;
  offset?: number | undefined;
  status?: 'pending' | 'accepted' | 'revoked' | 'expired' | undefined;
}
