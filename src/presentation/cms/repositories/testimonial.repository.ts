import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { TestimonialEntity, type ITestimonial } from '@domain/entities/testimonial';
import type { ITestimonialRepository } from './types';

/**
 * Acceso a datos de testimonios sobre la colección `testimonials`.
 */
export class TestimonialRepository
  extends BaseRepository<ITestimonial, TestimonialEntity>
  implements ITestimonialRepository
{
  public constructor(model: Model<ITestimonial>) {
    super(model);
  }

  public async findPublished(locale: string): Promise<TestimonialEntity[]> {
    return this.findMany({
      filter: { locale, published: true },
      sort: { order: 1 },
      projection: { published: 0, createdAt: 0, updatedAt: 0 },
    });
  }

  protected buildEntity(props: ITestimonial): TestimonialEntity {
    return new TestimonialEntity(props);
  }
}
