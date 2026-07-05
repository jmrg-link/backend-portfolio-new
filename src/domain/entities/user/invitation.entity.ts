import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de dominio de una invitación de Clerk: un alta pendiente que el
 * destinatario completa desde la plataforma con el ticket recibido por
 * email.
 *
 * @remarks
 * `status` recorre `pending → accepted | revoked | expired`. Los timestamps
 * son epoch en milisegundos.
 */
export interface IInvitation {
  id: string;
  email: string;
  status: string;
  url: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Entidad pura de invitación.
 */
export class InvitationEntity extends BaseEntity<IInvitation> {}
