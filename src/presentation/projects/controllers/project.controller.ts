import type { FastifyReply, FastifyRequest } from 'fastify';
import { OptionalLocaleDto, SlugLocaleDto } from '@domain/dtos/shared';
import { buildListBody } from '@domain/shared/pagination/pagination.types';
import type { IProjectService, ProjectListResult } from '../services';

/**
 * Frontera HTTP de proyectos: valida la entrada con los DTOs, delega en el
 * service y representa las entidades de salida.
 *
 * @remarks
 * Handlers como propiedades arrow para conservar `this` al registrarlos en
 * las rutas. Los errores (ZodError, NotFoundError) los resuelve la cadena
 * global — aquí no se capturan.
 */
export class ProjectController {
  public constructor(private readonly service: IProjectService) {}

  public readonly list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = OptionalLocaleDto.fromRequest(request.query);
    const result = await this.service.listPublished(dto.locale, request.pagination);
    await ProjectController.sendList(request, reply, result);
  };

  public readonly featured = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = OptionalLocaleDto.fromRequest(request.query);
    const projects = await this.service.listFeatured(dto.locale);
    await reply.send(projects.map(project => project.toEntity()));
  };

  public readonly getBySlug = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = SlugLocaleDto.fromRequest(request.params, request.query);
    const project = await this.service.getPublishedBySlug(dto.slug, dto.locale);
    await reply.send(project.toEntity());
  };

  private static async sendList(
    request: FastifyRequest,
    reply: FastifyReply,
    result: ProjectListResult
  ): Promise<void> {
    const data = result.items.map(project => project.toEntity());
    await reply.send(buildListBody(data, result.countTotal, request.pagination));
  }
}
