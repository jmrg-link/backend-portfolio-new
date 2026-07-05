import { Schema, type Connection, type Model } from 'mongoose';
import type { IExperience } from '@domain/entities/experience';

/**
 * Schema de la colección `experiences` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índices: único compuesto locale+company; locale+published+order para el
 * listado público.
 */
const experienceSchema = new Schema<IExperience>(
  {
    locale: { type: String, required: true },
    company: { type: String, required: true },
    position: { type: String, required: true },
    period: { type: String, required: true },
    tasks: { type: [String], default: [] },
    color: { type: String, default: 'navy' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'experiences' }
);

experienceSchema.index({ locale: 1, company: 1 }, { unique: true });
experienceSchema.index({ locale: 1, published: 1, order: 1 });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function experienceModel(db: Connection): Model<IExperience> {
  return db.model<IExperience>('Experience', experienceSchema);
}
