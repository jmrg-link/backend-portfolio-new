import type { FastifyReply, FastifyRequest } from 'fastify';
import { BlogPostIdDto, CreateBlogPostDto, UpdateBlogPostDto } from '@domain/dtos/blog';
import { OptionalLocaleDto, SlugLocaleDto } from '@domain/dtos/shared';
import { buildListBody } from '@domain/shared/pagination/pagination.types';
import { env } from '@config/envs';
import type { BlogListResult, IBlogService } from '../services';

/**
 * Frontera HTTP del blog: valida la entrada con los DTOs, delega en el
 * service y representa las entidades de salida.
 *
 * @remarks
 * Handlers como propiedades arrow para conservar `this` al registrarlos en
 * las rutas. Los errores (ZodError, NotFoundError, duplicados) los resuelve
 * la cadena global — aquí no se capturan.
 */
export class BlogController {
  public constructor(private readonly service: IBlogService) {}

  public readonly list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = OptionalLocaleDto.fromRequest(request.query);
    const result = await this.service.listPublished(dto.locale, request.pagination);
    await BlogController.sendList(request, reply, result);
  };

  public readonly getBySlug = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = SlugLocaleDto.fromRequest(request.params, request.query);
    const post = await this.service.getPublishedBySlug(dto.slug, dto.locale);
    await reply.send(post.toEntity());
  };

  public readonly adminList = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = OptionalLocaleDto.fromRequest(request.query);
    const result = await this.service.adminList(dto.locale, request.pagination);
    await BlogController.sendList(request, reply, result);
  };

  public readonly adminGetBySlug = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = SlugLocaleDto.fromRequest(request.params, request.query);
    const post = await this.service.adminGetBySlug(dto.slug, dto.locale);
    await reply.send(post.toEntity());
  };

  public readonly create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = CreateBlogPostDto.fromRequest(request.body);
    const post = await this.service.create(dto.data);
    const entity = post.toEntity();
    await reply
      .header(
        'Location',
        `${env.server.apiPrefix}/${env.server.apiVersion}/admin/blog/${entity._id ?? ''}`
      )
      .status(201)
      .send(entity);
  };

  public readonly update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = UpdateBlogPostDto.fromRequest(request.params, request.body);
    const post = await this.service.update(dto.id, dto.patch);
    await reply.send(post.toEntity());
  };

  public readonly remove = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = BlogPostIdDto.fromRequest(request.params);
    await this.service.remove(dto.id);
    await reply.status(204).send();
  };

  public readonly togglePublished = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = BlogPostIdDto.fromRequest(request.params);
    const post = await this.service.togglePublished(dto.id);
    await reply.send(post.toEntity());
  };

  private static async sendList(
    request: FastifyRequest,
    reply: FastifyReply,
    result: BlogListResult
  ): Promise<void> {
    const data = result.items.map(post => post.toEntity());
    await reply.send(buildListBody(data, result.countTotal, request.pagination));
  }
}
