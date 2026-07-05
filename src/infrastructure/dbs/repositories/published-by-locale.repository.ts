import { BaseRepository } from './base.repository';

/**
 * Base de los repositorios de colecciones publicables por idioma
 * (experiences, testimonials): listado público filtrado por locale y
 * published, ordenado por `order` ascendente.
 *
 * @remarks
 * El cast del `sort` es necesario: `order` es campo de todos los
 * documentos concretos de esta familia, pero el genérico TDoc no puede
 * expresar sus claves; el orden construido es válido para todos sus
 * subtipos.
 */
export abstract class PublishedByLocaleRepository<TDoc, TEntity> extends BaseRepository<
  TDoc,
  TEntity
> {
  public async findPublished(locale: string): Promise<TEntity[]> {
    return this.findMany({
      filter: { locale, published: true },
      sort: { order: 1 } as Parameters<typeof this.findMany>[0] extends { sort?: infer S }
        ? S
        : never,
    });
  }
}
