import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de la configuración global del sitio (singleton por locale): se
 * inyecta en el modelo Mongoose (`Schema<ISiteSettings>`) y la consume la
 * entidad.
 *
 * @remarks
 * Corresponde a la colección `sitesettings`; solo `updatedAt`, sin
 * `createdAt`. Los opcionales pueden persistir como null.
 */
export interface ISiteSettings {
  _id?: string;
  locale: string;
  siteName: string;
  siteTitle: string;
  description: string;
  ogImage?: string | null;
  author: string;
  email: string;
  github?: string | null;
  linkedin?: string | null;
  manfred?: string | null;
  cvUrl?: string | null;
  updatedAt?: Date;
}

/**
 * Entidad pura de SiteSettings.
 */
export class SiteSettingsEntity extends BaseEntity<ISiteSettings> {}
