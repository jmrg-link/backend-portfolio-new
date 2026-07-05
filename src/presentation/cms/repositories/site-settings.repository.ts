import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { SiteSettingsEntity, type ISiteSettings } from '@domain/entities/site-settings';
import type { ISiteSettingsRepository } from './types';

/**
 * Acceso a datos de la configuración del sitio sobre la colección
 * `sitesettings`.
 */
export class SiteSettingsRepository
  extends BaseRepository<ISiteSettings, SiteSettingsEntity>
  implements ISiteSettingsRepository
{
  public constructor(model: Model<ISiteSettings>) {
    super(model);
  }

  public async findByLocale(locale: string): Promise<SiteSettingsEntity | null> {
    return this.findOne({ locale });
  }

  protected buildEntity(props: ISiteSettings): SiteSettingsEntity {
    return new SiteSettingsEntity(props);
  }
}
