import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma del contenido de About (uno por locale): se inyecta en el modelo
 * Mongoose (`Schema<IAboutContent>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `aboutcontents`; solo `updatedAt`, sin
 * `createdAt`. `eduContent`, `philContent` y `facts` persisten como cadenas
 * JSON (arrays serializados).
 */
export interface IAboutContent {
  _id?: string;
  locale: string;
  badge: string;
  title: string;
  mainText: string;
  eduTitle: string;
  eduContent: string;
  philTitle: string;
  philContent: string;
  factsTitle: string;
  facts: string;
  image?: string | null;
  updatedAt?: Date;
}

/**
 * Entidad pura de AboutContent.
 */
export class AboutContentEntity extends BaseEntity<IAboutContent> {}
