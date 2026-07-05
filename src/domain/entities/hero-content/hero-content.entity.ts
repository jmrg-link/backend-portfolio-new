import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma del contenido del hero (uno por locale): se inyecta en el modelo
 * Mongoose (`Schema<IHeroContent>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `herocontents`; solo `updatedAt`, sin
 * `createdAt`.
 */
export interface IHeroContent {
  _id?: string;
  locale: string;
  greeting: string;
  description: string;
  location: string;
  availability: string;
  profileImage: string;
  updatedAt?: Date;
}

/**
 * Entidad pura de HeroContent.
 */
export class HeroContentEntity extends BaseEntity<IHeroContent> {}
