import type { ProjectEntity } from '@domain/entities/project';
import type { PaginationParams } from '@domain/shared/pagination/pagination.types';

/**
 * Colección de proyectos con su total real (countDocuments) para construir
 * la meta de paginación.
 */
export interface ProjectListResult {
  items: ProjectEntity[];
  countTotal: number;
}

/**
 * Contrato de negocio de proyectos: lecturas públicas con DTOs de entrada y
 * entidades de salida.
 */
export interface IProjectService {
  listPublished(locale?: string, pagination?: PaginationParams): Promise<ProjectListResult>;
  listFeatured(locale?: string): Promise<ProjectEntity[]>;
  getPublishedBySlug(slug: string, locale: string): Promise<ProjectEntity>;
}
