import { Schema, type Connection, type Model } from 'mongoose';
import type { IAboutContent } from '@domain/entities/about-content';

/**
 * Schema de la colección `aboutcontents` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índice único por locale (singleton por idioma); solo `updatedAt`, sin
 * `createdAt`. Los campos eduContent, philContent y facts guardan arrays
 * serializados como JSON.
 */
const aboutContentSchema = new Schema<IAboutContent>(
  {
    locale: { type: String, required: true },
    badge: { type: String, required: true },
    title: { type: String, required: true },
    mainText: { type: String, required: true },
    eduTitle: { type: String, required: true },
    eduContent: { type: String, required: true },
    philTitle: { type: String, required: true },
    philContent: { type: String, required: true },
    factsTitle: { type: String, required: true },
    facts: { type: String, required: true },
    image: { type: String },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'aboutcontents' }
);

aboutContentSchema.index({ locale: 1 }, { unique: true });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function aboutContentModel(db: Connection): Model<IAboutContent> {
  return db.model<IAboutContent>('AboutContent', aboutContentSchema);
}
