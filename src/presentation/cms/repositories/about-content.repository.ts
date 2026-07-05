import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { AboutContentEntity, type IAboutContent } from '@domain/entities/about-content';
import type { IAboutContentRepository } from './types';

/**
 * Acceso a datos del contenido de About sobre la colección `aboutcontents`.
 */
export class AboutContentRepository
  extends BaseRepository<IAboutContent, AboutContentEntity>
  implements IAboutContentRepository
{
  public constructor(model: Model<IAboutContent>) {
    super(model);
  }

  public async findByLocale(locale: string): Promise<AboutContentEntity | null> {
    return this.findOne({ locale });
  }

  protected buildEntity(props: IAboutContent): AboutContentEntity {
    return new AboutContentEntity(props);
  }
}
