import { Schema, type Connection, type Model } from 'mongoose';
import type { ISkill } from '@domain/entities/skill';

/**
 * Schema de la colección `skills` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índice compuesto category+order para el listado agrupado por categoría.
 */
const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'skills' }
);

skillSchema.index({ category: 1, order: 1 });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function skillModel(db: Connection): Model<ISkill> {
  return db.model<ISkill>('Skill', skillSchema);
}
