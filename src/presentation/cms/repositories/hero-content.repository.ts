import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { HeroContentEntity, type IHeroContent } from '@domain/entities/hero-content';
import type { IHeroContentRepository } from './types';

/**
 * Acceso a datos del contenido del hero sobre la colección `herocontents`.
 */
export class HeroContentRepository
  extends BaseRepository<IHeroContent, HeroContentEntity>
  implements IHeroContentRepository
{
  public constructor(model: Model<IHeroContent>) {
    super(model);
  }

  public async findByLocale(locale: string): Promise<HeroContentEntity | null> {
    return this.findOne({ locale });
  }

  protected buildEntity(props: IHeroContent): HeroContentEntity {
    return new HeroContentEntity(props);
  }
}
