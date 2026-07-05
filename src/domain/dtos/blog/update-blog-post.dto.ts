import { z } from 'zod';
import type { UpdateBlogPostData } from '@domain/types/blog';
import { objectIdSchema } from './blog.schemas';

export const updateBlogPostParamsSchema = z.object({ id: objectIdSchema });
export const updateBlogPostBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  image: z.url().optional(),
});

/**
 * Entrada de la actualización parcial de un post: id de params y campos
 * opcionales del body.
 *
 * @remarks
 * `slug`, `author`, `locale` y `readingTime` no son editables; el service
 * recalcula `readingTime` si cambia `content`.
 * @throws {ZodError} si params o body no cumplen su schema.
 */
export class UpdateBlogPostDto {
  private constructor(
    public readonly id: string,
    public readonly patch: UpdateBlogPostData
  ) {}

  public static fromRequest(params: unknown, body: unknown): UpdateBlogPostDto {
    const { id } = updateBlogPostParamsSchema.parse(params);
    return new UpdateBlogPostDto(id, updateBlogPostBodySchema.parse(body));
  }
}
