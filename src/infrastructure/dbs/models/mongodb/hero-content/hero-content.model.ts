import { Schema, type Connection, type Model } from 'mongoose';
import type { IHeroContent } from '@domain/entities/hero-content';

/**
 * Schema de la colección `herocontents` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índice único por locale (singleton por idioma); solo `updatedAt`, sin
 * `createdAt`.
 */
const heroContentSchema = new Schema<IHeroContent>(
  {
    locale: { type: String, required: true },
    greeting: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    availability: { type: String, required: true },
    profileImage: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'herocontents' }
);

heroContentSchema.index({ locale: 1 }, { unique: true });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function heroContentModel(db: Connection): Model<IHeroContent> {
  return db.model<IHeroContent>('HeroContent', heroContentSchema);
}
