import { Schema, type Connection, type Model } from 'mongoose';
import type { ITestimonial } from '@domain/entities/testimonial';

/**
 * Schema de la colección `testimonials` construido sobre la interfaz de la
 * entidad.
 *
 * @remarks
 * Índices: único compuesto locale+author; locale+published+order para el
 * listado público.
 */
const testimonialSchema = new Schema<ITestimonial>(
  {
    locale: { type: String, required: true },
    author: { type: String, required: true },
    initials: { type: String, required: true },
    position: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: String, required: true },
    gradient: { type: String, default: 'navy' },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'testimonials' }
);

testimonialSchema.index({ locale: 1, author: 1 }, { unique: true });
testimonialSchema.index({ locale: 1, published: 1, order: 1 });

/**
 * Crea el modelo sobre la conexión activa (multi-conexión vía
 * DatabaseConnector); no usa el registro global de mongoose.
 */
export function testimonialModel(db: Connection): Model<ITestimonial> {
  return db.model<ITestimonial>('Testimonial', testimonialSchema);
}
