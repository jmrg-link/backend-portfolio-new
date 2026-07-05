import { NotFoundError } from '@event-driven-io/emmett';
import type { BlogPostEntity } from '@domain/entities/blog';
import type { CreateBlogPostData, UpdateBlogPostData } from '@domain/types/blog';
import type { PaginationParams } from '@domain/shared/pagination/pagination.types';
import type { IBlogRepository } from '../repositories';
import type { BlogListResult, IBlogService } from './types';

/**
 * Lógica de negocio del blog: lecturas públicas (solo publicados) y
 * operaciones de administración sobre el repositorio.
 *
 * @remarks
 * Los duplicados de slug+locale los resuelve el índice único de la colección
 * (la cadena de errores los responde como 409). `readingTime` se calcula
 * aquí a 200 palabras/minuto, nunca lo aporta el cliente.
 */
export class BlogService implements IBlogService {
  public constructor(private readonly repository: IBlogRepository) {}

  public async listPublished(
    locale?: string,
    pagination?: PaginationParams
  ): Promise<BlogListResult> {
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

  /**
   * @throws {NotFoundError} si no existe un post publicado con ese slug.
   */
  public async getPublishedBySlug(slug: string, locale: string): Promise<BlogPostEntity> {
    const post = await this.repository.findPublishedBySlug(slug, locale);
    if (post === null) {
      throw new NotFoundError({ id: slug, type: 'BlogPost', message: 'Post no encontrado' });
    }
    return post;
  }

  public async adminList(locale?: string, pagination?: PaginationParams): Promise<BlogListResult> {
    if (pagination === undefined) {
      const items = await this.repository.findAll(locale);
      return { items, countTotal: items.length };
    }
    const [items, countTotal] = await Promise.all([
      this.repository.findAll(locale, { skip: pagination.skip, limit: pagination.limit }),
      this.repository.countByLocale(locale),
    ]);
    return { items, countTotal };
  }

  /**
   * @throws {NotFoundError} si no existe el post (publicado o borrador).
   */
  public async adminGetBySlug(slug: string, locale: string): Promise<BlogPostEntity> {
    const post = await this.repository.findBySlug(slug, locale);
    if (post === null) {
      throw new NotFoundError({ id: slug, type: 'BlogPost', message: 'Post no encontrado' });
    }
    return post;
  }

  public async create(data: CreateBlogPostData): Promise<BlogPostEntity> {
    return this.repository.create({
      ...data,
      readingTime: BlogService.calculateReadingTime(data.content),
    });
  }

  /**
   * Actualiza los campos presentes y recalcula `readingTime` cuando cambia
   * el contenido.
   *
   * @throws {NotFoundError} si el id no corresponde a ningún post.
   */
  public async update(id: string, patch: UpdateBlogPostData): Promise<BlogPostEntity> {
    const effectivePatch: UpdateBlogPostData =
      patch.content !== undefined
        ? { ...patch, readingTime: BlogService.calculateReadingTime(patch.content) }
        : patch;
    const updated = await this.repository.updateById(id, effectivePatch);
    if (updated === null) throw new NotFoundError({ id, type: 'BlogPost' });
    return updated;
  }

  /**
   * @throws {NotFoundError} si el id no corresponde a ningún post.
   */
  public async remove(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) throw new NotFoundError({ id, type: 'BlogPost' });
  }

  /**
   * Invierte el estado de publicación y devuelve el post actualizado.
   *
   * @throws {NotFoundError} si el id no corresponde a ningún post.
   */
  public async togglePublished(id: string): Promise<BlogPostEntity> {
    const current = await this.repository.findById(id);
    if (current === null) throw new NotFoundError({ id, type: 'BlogPost' });
    const updated = await this.repository.updateById(id, {
      published: !current.toEntity().published,
    });
    if (updated === null) throw new NotFoundError({ id, type: 'BlogPost' });
    return updated;
  }

  /**
   * Minutos de lectura estimados a 200 palabras/minuto.
   */
  private static calculateReadingTime(content: string): number {
    return Math.ceil(content.split(/\s+/).length / 200);
  }
}
