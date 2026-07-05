import type { ProjectEntity } from '@domain/entities/project';
import type { FindPublishedOptions } from '@domain/types/project';

/**
 * Contrato de acceso a datos de proyectos: los services dependen de esta
 * interfaz, nunca de la clase concreta.
 *
 * @remarks
 * Solo expone lecturas públicas.
 */
export interface IProjectRepository {
  findById(id: string): Promise<ProjectEntity | null>;
  findPublishedBySlug(slug: string, locale: string): Promise<ProjectEntity | null>;
  findPublished(options?: FindPublishedOptions): Promise<ProjectEntity[]>;
  findFeatured(locale?: string): Promise<ProjectEntity[]>;
  findRecent(limit: number): Promise<ProjectEntity[]>;
  countPublished(locale?: string): Promise<number>;
}
