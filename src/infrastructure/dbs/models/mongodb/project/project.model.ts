import { Schema, type Connection, type Model } from 'mongoose';
import type { IProject } from '@domain/entities/project';

/**
 * Schema de la colección `projects` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índices: único compuesto slug+locale; published+locale; featured; order.
 */
const projectSchema = new Schema<IProject>(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, required: true },
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    locale: { type: String, default: 'es' },
    status: { type: String, default: 'completed' },
    tech: { type: [String], default: [] },
    github: { type: String },
    demo: { type: String },
    image: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'projects' }
);

projectSchema.index({ slug: 1, locale: 1 }, { unique: true });
projectSchema.index({ published: 1, locale: 1 });
projectSchema.index({ featured: 1 });
projectSchema.index({ order: 1 });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function projectModel(db: Connection): Model<IProject> {
  return db.model<IProject>('Project', projectSchema);
}
