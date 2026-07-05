import { z } from 'zod';
import { objectIdSchema } from './blog.schemas';

export const blogPostIdParamsSchema = z.object({ id: objectIdSchema });

/**
 * Entrada de las operaciones por id (update, delete, toggle).
 *
 * @throws {ZodError} si el id no es un ObjectId válido.
 */
export class BlogPostIdDto {
  private constructor(public readonly id: string) {}

  public static fromRequest(params: unknown): BlogPostIdDto {
    const parsed = blogPostIdParamsSchema.parse(params);
    return new BlogPostIdDto(parsed.id);
  }
}
