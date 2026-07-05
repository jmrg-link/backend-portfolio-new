import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { ProjectEntity, type IProject } from '@domain/entities/project';
import type { CreateProjectData, FindPublishedOptions } from '@domain/types/project';
import type { IProjectRepository } from './types';

/**
 * Acceso a datos de proyectos sobre la colección `projects`: hereda las
 * operaciones comunes de la base y añade las consultas propias del slice.
 *
 * @remarks
 * El orden de los listados es `order` ascendente y, a igualdad, `date`
 * descendente.
 */
export class ProjectRepository
  extends BaseRepository<IProject, ProjectEntity, CreateProjectData>
  implements IProjectRepository
{
  public constructor(model: Model<IProject>) {
    super(model);
  }

  public async findPublishedBySlug(slug: string, locale: string): Promise<ProjectEntity | null> {
    return this.findOne({ slug, locale, published: true });
  }

  public async findPublished(options: FindPublishedOptions = {}): Promise<ProjectEntity[]> {
    const { locale, skip = 0, limit = 0 } = options;
    return this.findMany({
      filter: { published: true, ...(locale !== undefined && { locale }) },
      skip,
      limit,
      sort: { order: 1, date: -1 },
      projection: { content: 0 },
    });
  }

  public async findFeatured(locale?: string): Promise<ProjectEntity[]> {
    return this.findMany({
      filter: { published: true, featured: true, ...(locale !== undefined && { locale }) },
      sort: { order: 1, date: -1 },
      projection: { content: 0 },
    });
  }

  public async findRecent(limit: number): Promise<ProjectEntity[]> {
    return this.findMany({
      limit,
      sort: { updatedAt: -1 },
      projection: { content: 0 },
    });
  }

  public async countPublished(locale?: string): Promise<number> {
    return this.count({ published: true, ...(locale !== undefined && { locale }) });
  }

  protected buildEntity(props: IProject): ProjectEntity {
    return new ProjectEntity(props);
  }
}
