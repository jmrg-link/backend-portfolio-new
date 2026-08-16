import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { ExperienceEntity, type IExperience } from '@domain/entities/experience';
import type { IExperienceRepository } from './types';

/**
 * Acceso a datos de experiencias sobre la colección `experiences`.
 */
export class ExperienceRepository
  extends BaseRepository<IExperience, ExperienceEntity>
  implements IExperienceRepository
{
  public constructor(model: Model<IExperience>) {
    super(model);
  }

  public async findPublished(locale: string): Promise<ExperienceEntity[]> {
    return this.findMany({
      filter: { locale, published: true },
      sort: { order: 1 },
      projection: { published: 0, createdAt: 0, updatedAt: 0 },
    });
  }

  protected buildEntity(props: IExperience): ExperienceEntity {
    return new ExperienceEntity(props);
  }
}
