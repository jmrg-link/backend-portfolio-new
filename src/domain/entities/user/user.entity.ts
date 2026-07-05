import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de dominio de un usuario de la plataforma: proyección estable de la
 * cuenta gestionada en Clerk que expone la API de administración.
 *
 * @remarks
 * `publicMetadata` transporta datos no sensibles (rol, preferencias); no se
 * exponen la metadata privada ni credenciales. Los timestamps son epoch en
 * milisegundos; `email` es la dirección principal.
 */
export interface IUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  banned: boolean;
  locked: boolean;
  publicMetadata: Record<string, unknown>;
  createdAt: number;
  lastSignInAt: number | null;
}

/**
 * Entidad pura de usuario; copia también su `publicMetadata` al
 * representarse.
 */
export class UserEntity extends BaseEntity<IUser> {
  public override toEntity(): IUser {
    return { ...this.props, publicMetadata: { ...this.props.publicMetadata } };
  }
}
