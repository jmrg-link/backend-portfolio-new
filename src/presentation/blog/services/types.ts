import type { BlogPostEntity } from '@domain/entities/blog';
import type { CreateBlogPostData, UpdateBlogPostData } from '@domain/types/blog';
import type { PaginationParams } from '@domain/shared/pagination/pagination.types';

/**
 * Colección de posts con su total real (countDocuments) para construir la
 * meta de paginación.
 */
export interface BlogListResult {
  items: BlogPostEntity[];
  countTotal: number;
}

/**
 * Contrato de negocio del blog: operaciones de lectura pública y
 * administración con DTOs de entrada y entidades de salida.
 */
export interface IBlogService {
  listPublished(locale?: string, pagination?: PaginationParams): Promise<BlogListResult>;
  getPublishedBySlug(slug: string, locale: string): Promise<BlogPostEntity>;
  adminList(locale?: string, pagination?: PaginationParams): Promise<BlogListResult>;
  adminGetBySlug(slug: string, locale: string): Promise<BlogPostEntity>;
  create(data: CreateBlogPostData): Promise<BlogPostEntity>;
  update(id: string, patch: UpdateBlogPostData): Promise<BlogPostEntity>;
  remove(id: string): Promise<void>;
  togglePublished(id: string): Promise<BlogPostEntity>;
}
