import { z } from 'zod';
import type { CreateBlogPostData } from '@domain/types/blog';

export const createBlogPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
  date: z.coerce.date(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  locale: z.string().min(2).max(5).optional(),
  tags: z.array(z.string()).optional(),
  image: z.url().optional(),
  author: z.string().min(1).optional(),
});

/**
 * Entrada de la creación de un post: valida el body y expone los datos
 * tipados para el service.
 *
 * @remarks
 * `readingTime` no se acepta del cliente: lo calcula el service a partir
 * del contenido.
 * @throws {ZodError} si el body no cumple el schema.
 */
export class CreateBlogPostDto {
  private constructor(public readonly data: CreateBlogPostData) {}

  public static fromRequest(body: unknown): CreateBlogPostDto {
    return new CreateBlogPostDto(createBlogPostSchema.parse(body));
  }
}
