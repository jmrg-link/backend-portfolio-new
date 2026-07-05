import type { AnyKeys, Model, QueryFilter, SortOrder, UpdateQuery } from 'mongoose';

/**
 * Opciones de consulta paginada reutilizables por todos los repositorios.
 *
 * @remarks
 * `projection` excluye (0) o restringe (1) campos del documento leído: los
 * listados "meta" omiten así los cuerpos pesados.
 */
export interface FindManyOptions<TDoc> {
  filter?: QueryFilter<TDoc>;
  skip?: number;
  limit?: number;
  sort?: Partial<Record<keyof TDoc & string, SortOrder>>;
  projection?: Partial<Record<keyof TDoc & string, 0 | 1>>;
}

/**
 * Repositorio base abstracto sobre Mongoose: resuelve las operaciones comunes
 * de lectura y escritura (búsqueda, paginación, conteo, creación,
 * actualización y borrado) devolviendo entidades de dominio.
 *
 * @remarks
 * Cada repositorio concreto aporta `toDomain` (documento lean → entidad) y
 * sus consultas específicas; el documento de Mongoose no sale de esta capa.
 */
export abstract class BaseRepository<TDoc, TEntity, TCreate extends AnyKeys<TDoc> = AnyKeys<TDoc>> {
  protected constructor(protected readonly model: Model<TDoc>) {}

  /**
   * Construye la entidad concreta del slice desde las props ya
   * normalizadas; cada repositorio aporta su constructor.
   */
  protected abstract buildEntity(props: TDoc): TEntity;

  /**
   * Mapea un documento lean a la entidad de dominio normalizando `_id` a
   * string antes de delegar en buildEntity.
   *
   * @remarks
   * El cast está justificado: el documento lean entrega `_id` como
   * ObjectId en runtime aunque la interfaz de la entidad lo declare
   * string; este método es el único punto donde ambas formas conviven y
   * toString() restituye el contrato declarado.
   */
  protected toDomain(doc: TDoc): TEntity {
    const props = { ...doc } as TDoc & { _id?: string | { toString(): string } };
    if (props._id !== undefined) props._id = props._id.toString();
    return this.buildEntity(props);
  }

  public async findById(id: string): Promise<TEntity | null> {
    const doc = await this.model.findById(id).lean<TDoc>().exec();
    return doc === null ? null : this.toDomain(doc);
  }

  public async findOne(filter: QueryFilter<TDoc>): Promise<TEntity | null> {
    const doc = await this.model.findOne(filter).lean<TDoc>().exec();
    return doc === null ? null : this.toDomain(doc);
  }

  /**
   * Lista documentos con filtro, paginación, orden y proyección opcionales.
   *
   * @remarks
   * `sort` y `projection` se estrechan a las index signatures que exige
   * Mongoose (`Record<string, SortOrder>` / `Record<string, 0 | 1>`): sus
   * claves son nombres de campo de `TDoc`, que el genérico no expresa como
   * index signature.
   */
  public async findMany(options: FindManyOptions<TDoc> = {}): Promise<TEntity[]> {
    const { filter = {}, skip = 0, limit = 0, sort, projection } = options;
    let query = this.model.find(filter).skip(skip);
    if (limit > 0) query = query.limit(limit);
    if (sort !== undefined) query = query.sort(sort as Record<string, SortOrder>);
    if (projection !== undefined) query = query.select(projection as Record<string, 0 | 1>);
    const docs = await query.lean<TDoc[]>().exec();
    return docs.map(doc => this.toDomain(doc));
  }

  public async count(filter: QueryFilter<TDoc> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  public async create(data: TCreate): Promise<TEntity> {
    const created = await this.model.create(data);
    return this.toDomain(created.toObject());
  }

  public async updateById(id: string, update: UpdateQuery<TDoc>): Promise<TEntity | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .lean<TDoc>()
      .exec();
    return doc === null ? null : this.toDomain(doc);
  }

  public async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).lean<TDoc>().exec();
    return result !== null;
  }
}
