import { Schema, type Connection, type Model } from 'mongoose';
import type { ISkillCategory } from '@domain/entities/skill-category';

/**
 * Schema de la colección `skillcategories` construido sobre la interfaz de
 * la entidad.
 *
 * @remarks
 * Índice único por key; solo `updatedAt`, sin `createdAt`.
 */
const skillCategorySchema = new Schema<ISkillCategory>(
  {
    key: { type: String, required: true },
    labelEs: { type: String, required: true },
    labelEn: { type: String, required: true },
    colorClass: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true }, collection: 'skillcategories' }
);

skillCategorySchema.index({ key: 1 }, { unique: true });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function skillCategoryModel(db: Connection): Model<ISkillCategory> {
  return db.model<ISkillCategory>('SkillCategory', skillCategorySchema);
}
