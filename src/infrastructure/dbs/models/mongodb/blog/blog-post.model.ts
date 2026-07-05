import { Schema, type Connection, type Model } from 'mongoose';
import type { IBlogPost } from '@domain/entities/blog';

/**
 * Schema de la colección `blogposts` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índices: único compuesto slug+locale; published+locale; featured.
 */
const blogPostSchema = new Schema<IBlogPost>(
  {
    slug: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: Date, required: true },
    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    locale: { type: String, default: 'es' },
    tags: { type: [String], default: [] },
    image: { type: String },
    author: { type: String, default: 'JMRG' },
    readingTime: { type: Number },
  },
  { timestamps: true, collection: 'blogposts' }
);

blogPostSchema.index({ slug: 1, locale: 1 }, { unique: true });
blogPostSchema.index({ published: 1, locale: 1 });
blogPostSchema.index({ featured: 1 });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function blogPostModel(db: Connection): Model<IBlogPost> {
  return db.model<IBlogPost>('BlogPost', blogPostSchema);
}
