import { NotFoundError } from '@event-driven-io/emmett';
import type { ProjectEntity } from '@domain/entities/project';
import type { PaginationParams } from '@domain/shared/pagination/pagination.types';
import type { IProjectRepository } from '../repositories';
import type { IProjectService, ProjectListResult } from './types';

/**
 * Lógica de negocio de proyectos: lecturas públicas sobre el repositorio
 * (solo publicados).
 *
 * @remarks
 * Los destacados filtran published+featured en la consulta.
 */
export class ProjectService implements IProjectService {
  public constructor(private readonly repository: IProjectRepository) {}

  public async listPublished(
    locale?: string,
    pagination?: PaginationParams
  ): Promise<ProjectListResult> {
    if (pagination === undefined) {
      const items = await this.repository.findPublished({ locale });
      return { items, countTotal: items.length };
    }
    const [items, countTotal] = await Promise.all([
      this.repository.findPublished({ locale, skip: pagination.skip, limit: pagination.limit }),
      this.repository.countPublished(locale),
    ]);
    return { items, countTotal };
  }

  public async listFeatured(locale?: string): Promise<ProjectEntity[]> {
    return this.repository.findFeatured(locale);
  }

  /**
   * @throws {NotFoundError} si no existe un proyecto publicado con ese slug.
   */
  public async getPublishedBySlug(slug: string, locale: string): Promise<ProjectEntity> {
    const project = await this.repository.findPublishedBySlug(slug, locale);
    if (project === null) {
      throw new NotFoundError({ id: slug, type: 'Project', message: 'Proyecto no encontrado' });
    }
    return project;
  }
}
