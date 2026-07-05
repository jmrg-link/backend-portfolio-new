import { BaseRepository } from './base.repository';

/**
 * Base de los repositorios de contenido singleton por idioma
 * (sitesettings, herocontents, aboutcontents): una lectura única por
 * locale que puede no existir.
 */
export abstract class LocaleSingletonRepository<TDoc, TEntity> extends BaseRepository<
  TDoc,
  TEntity
> {
  public async findByLocale(locale: string): Promise<TEntity | null> {
    return this.findOne({ locale });
  }
}
