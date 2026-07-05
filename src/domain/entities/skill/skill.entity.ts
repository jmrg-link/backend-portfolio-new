import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de una skill del portfolio: se inyecta en el modelo Mongoose
 * (`Schema<ISkill>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `skills`; sin locale — las skills son
 * compartidas entre idiomas. `icon` es el nombre de un icono de lucide.
 */
export interface ISkill {
  _id?: string;
  name: string;
  category: string;
  icon: string;
  order: number;
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad pura de Skill.
 */
export class SkillEntity extends BaseEntity<ISkill> {}
