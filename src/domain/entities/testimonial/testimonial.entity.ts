import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de un testimonio: se inyecta en el modelo Mongoose
 * (`Schema<ITestimonial>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `testimonials`; único por locale+author.
 * `date` es texto libre localizado ('Enero 2024'), no una fecha;
 * `gradient` es una clave de estilo del frontend (navy, success).
 */
export interface ITestimonial {
  _id?: string;
  locale: string;
  author: string;
  initials: string;
  position: string;
  text: string;
  date: string;
  gradient: string;
  order: number;
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad pura de Testimonial.
 */
export class TestimonialEntity extends BaseEntity<ITestimonial> {}
