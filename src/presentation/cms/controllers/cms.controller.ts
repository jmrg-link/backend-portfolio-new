import type { FastifyReply, FastifyRequest } from 'fastify';
import { ListSkillsDto } from '@domain/dtos/cms';
import { LocaleDto } from '@domain/dtos/shared';
import type { ICmsService } from '../services';

/**
 * Frontera HTTP del CMS: valida la entrada con los DTOs, delega en el
 * service y representa las entidades de salida.
 *
 * @remarks
 * Handlers como propiedades arrow para conservar `this` al registrarlos en
 * las rutas. Los singleton inexistentes responden el literal null (200). Los
 * errores los resuelve la cadena global — aquí no se capturan.
 */
export class CmsController {
  public constructor(private readonly service: ICmsService) {}

  public readonly getSiteSettings = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = LocaleDto.fromRequest(request.query);
    const settings = await this.service.getSiteSettings(dto.locale);
    await reply.send(settings === null ? null : settings.toEntity());
  };

  public readonly getHero = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const dto = LocaleDto.fromRequest(request.query);
    const hero = await this.service.getHero(dto.locale);
    await reply.send(hero === null ? null : hero.toEntity());
  };

  public readonly getAbout = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = LocaleDto.fromRequest(request.query);
    const about = await this.service.getAbout(dto.locale);
    await reply.send(about === null ? null : about.toEntity());
  };

  public readonly listSkills = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = ListSkillsDto.fromRequest(request.query);
    const skills = await this.service.listSkills({
      category: dto.category,
      published: dto.published,
    });
    await reply.send(skills.map(skill => skill.toEntity()));
  };

  public readonly listExperiences = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = LocaleDto.fromRequest(request.query);
    const experiences = await this.service.listExperiences(dto.locale);
    await reply.send(experiences.map(experience => experience.toEntity()));
  };

  public readonly listTestimonials = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const dto = LocaleDto.fromRequest(request.query);
    const testimonials = await this.service.listTestimonials(dto.locale);
    await reply.send(testimonials.map(testimonial => testimonial.toEntity()));
  };
}
