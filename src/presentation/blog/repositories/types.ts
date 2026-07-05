import type { BlogPostEntity } from '@domain/entities/blog';
import type {
  CreateBlogPostData,
  FindPublishedOptions,
  UpdateBlogPostData,
} from '@domain/types/blog';

/**
 * Contrato de acceso a datos del blog: los services dependen de esta
 * interfaz, nunca de la clase concreta.
 */
export interface IBlogRepository {
  findById(id: string): Promise<BlogPostEntity | null>;
  findBySlug(slug: string, locale: string): Promise<BlogPostEntity | null>;
  findPublishedBySlug(slug: string, locale: string): Promise<BlogPostEntity | null>;
  findPublished(options?: FindPublishedOptions): Promise<BlogPostEntity[]>;
  findAll(locale?: string, options?: FindRangeOptions): Promise<BlogPostEntity[]>;
  findRecent(limit: number): Promise<BlogPostEntity[]>;
  countByLocale(locale?: string): Promise<number>;
  countPublished(locale?: string): Promise<number>;
  create(data: CreateBlogPostData): Promise<BlogPostEntity>;
  updateById(id: string, patch: UpdateBlogPostData): Promise<BlogPostEntity | null>;
  deleteById(id: string): Promise<boolean>;
}

/**
 * Ventana de lectura para listados paginables.
 */
export interface FindRangeOptions {
  skip?: number | undefined;
  limit?: number | undefined;
}
