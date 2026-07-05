import { Schema, type Connection, type Model } from 'mongoose';
import type { ISiteSettings } from '@domain/entities/site-settings';

/**
 * Schema de la colección `sitesettings` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índice único por locale (singleton por idioma); solo `updatedAt`, sin
 * `createdAt`.
 */
const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    locale: { type: String, required: true },
    siteName: { type: String, required: true },
    siteTitle: { type: String, required: true },
    description: { type: String, required: true },
    ogImage: { type: String },
    author: { type: String, required: true },
    email: { type: String, required: true },
    github: { type: String },
    linkedin: { type: String },
    manfred: { type: String },
    cvUrl: { type: String },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'sitesettings' }
);

siteSettingsSchema.index({ locale: 1 }, { unique: true });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function siteSettingsModel(db: Connection): Model<ISiteSettings> {
  return db.model<ISiteSettings>('SiteSettings', siteSettingsSchema);
}
