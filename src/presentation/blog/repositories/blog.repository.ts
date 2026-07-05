import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { BlogPostEntity, type IBlogPost } from '@domain/entities/blog';
import type {
  CreateBlogPostData,
  FindPublishedOptions,
  UpdateBlogPostData,
} from '@domain/types/blog';
import type { FindRangeOptions, IBlogRepository } from './types';

/**
 * Acceso a datos del blog sobre la colección `blogposts`: hereda las
 * operaciones comunes de la base y añade las consultas propias del slice.
 */
export class BlogRepository
  extends BaseRepository<IBlogPost, BlogPostEntity, CreateBlogPostData>
  implements IBlogRepository
{
  public constructor(model: Model<IBlogPost>) {
    super(model);
  }

  public async findBySlug(slug: string, locale: string): Promise<BlogPostEntity | null> {
    return this.findOne({ slug, locale });
  }

  public async findPublishedBySlug(slug: string, locale: string): Promise<BlogPostEntity | null> {
    return this.findOne({ slug, locale, published: true });
  }

  public async findPublished(options: FindPublishedOptions = {}): Promise<BlogPostEntity[]> {
    const { locale, skip = 0, limit = 0 } = options;
    return this.findMany({
      filter: { published: true, ...(locale !== undefined && { locale }) },
      skip,
      limit,
      sort: { date: -1 },
      projection: { content: 0 },
    });
  }

  public async findAll(locale?: string, options: FindRangeOptions = {}): Promise<BlogPostEntity[]> {
    const { skip = 0, limit = 0 } = options;
    return this.findMany({
      filter: locale === undefined ? {} : { locale },
      skip,
      limit,
      sort: { date: -1 },
      projection: { content: 0 },
    });
  }

  public async findRecent(limit: number): Promise<BlogPostEntity[]> {
    return this.findMany({
      limit,
      sort: { updatedAt: -1 },
      projection: { content: 0 },
    });
  }

  public async countByLocale(locale?: string): Promise<number> {
    return this.count(locale === undefined ? {} : { locale });
  }

  public async countPublished(locale?: string): Promise<number> {
    return this.count({ published: true, ...(locale !== undefined && { locale }) });
  }

  public override async updateById(
    id: string,
    patch: UpdateBlogPostData
  ): Promise<BlogPostEntity | null> {
    return super.updateById(id, { $set: patch });
  }

  protected buildEntity(props: IBlogPost): BlogPostEntity {
    return new BlogPostEntity(props);
  }
}
