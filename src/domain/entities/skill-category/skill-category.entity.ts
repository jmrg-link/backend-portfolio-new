import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de una categoría de skills (gestión en admin): se inyecta en el
 * modelo Mongoose (`Schema<ISkillCategory>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `skillcategories`; solo `updatedAt`, sin
 * `createdAt`. `colorClass` son clases de estilo del frontend.
 */
export interface ISkillCategory {
  _id?: string;
  key: string;
  labelEs: string;
  labelEn: string;
  colorClass: string;
  order: number;
  updatedAt?: Date;
}

/**
 * Entidad pura de SkillCategory.
 */
export class SkillCategoryEntity extends BaseEntity<ISkillCategory> {}
