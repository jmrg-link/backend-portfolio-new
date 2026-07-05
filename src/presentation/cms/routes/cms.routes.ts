import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { siteSettingsModel } from '@infrastructure/dbs/models/mongodb/site-settings';
import { heroContentModel } from '@infrastructure/dbs/models/mongodb/hero-content';
import { aboutContentModel } from '@infrastructure/dbs/models/mongodb/about-content';
import { skillModel } from '@infrastructure/dbs/models/mongodb/skill';
import { experienceModel } from '@infrastructure/dbs/models/mongodb/experience';
import { testimonialModel } from '@infrastructure/dbs/models/mongodb/testimonial';
import {
  aboutContentResponseSchema,
  experienceListSchema,
  heroContentResponseSchema,
  listSkillsSchema,
  siteSettingsResponseSchema,
  skillListSchema,
  testimonialListSchema,
} from '@domain/dtos/cms';
import { localeSchema, problemDetailsSchema } from '@domain/dtos/shared';
import type { RouteModule } from '@presentation/bootstrap/routes';
import {
  AboutContentRepository,
  ExperienceRepository,
  HeroContentRepository,
  SiteSettingsRepository,
  SkillRepository,
  TestimonialRepository,
} from '../repositories';
import { CmsService } from '../services';
import { CmsController } from '../controllers';

const TAGS = ['CMS'];
const localeQuerystring = z.object({ locale: localeSchema });
const errors = { 400: problemDetailsSchema, 401: problemDetailsSchema };

/**
 * Rutas del CMS: compone las dependencias del bloque (modelos →
 * repositorios → service → controller) y registra las lecturas públicas del
 * contenido dinámico bajo el prefijo v1.
 *
 * @remarks
 * Sin paginación: son colecciones cortas que se sirven completas.
 */
const cmsRoutes: FastifyPluginAsync = async app => {
  const db = DatabaseConnector.getPortfolioDb();
  const service = new CmsService(
    new SiteSettingsRepository(siteSettingsModel(db)),
    new HeroContentRepository(heroContentModel(db)),
    new AboutContentRepository(aboutContentModel(db)),
    new SkillRepository(skillModel(db)),
    new ExperienceRepository(experienceModel(db)),
    new TestimonialRepository(testimonialModel(db))
  );
  const controller = new CmsController(service);

  app.get(
    '/cms/site-settings',
    {
      schema: {
        tags: TAGS,
        summary: 'Obtener configuración del sitio',
        querystring: localeQuerystring,
        response: { 200: siteSettingsResponseSchema.nullable(), ...errors },
      },
    },
    controller.getSiteSettings
  );

  app.get(
    '/cms/hero',
    {
      schema: {
        tags: TAGS,
        summary: 'Obtener contenido del hero',
        querystring: localeQuerystring,
        response: { 200: heroContentResponseSchema.nullable(), ...errors },
      },
    },
    controller.getHero
  );

  app.get(
    '/cms/about',
    {
      schema: {
        tags: TAGS,
        summary: 'Obtener contenido de About',
        querystring: localeQuerystring,
        response: { 200: aboutContentResponseSchema.nullable(), ...errors },
      },
    },
    controller.getAbout
  );

  app.get(
    '/cms/skills',
    {
      schema: {
        tags: TAGS,
        summary: 'Listar skills',
        querystring: listSkillsSchema,
        response: { 200: skillListSchema, ...errors },
      },
    },
    controller.listSkills
  );

  app.get(
    '/cms/experiences',
    {
      schema: {
        tags: TAGS,
        summary: 'Listar experiencias',
        querystring: localeQuerystring,
        response: { 200: experienceListSchema, ...errors },
      },
    },
    controller.listExperiences
  );

  app.get(
    '/cms/testimonials',
    {
      schema: {
        tags: TAGS,
        summary: 'Listar testimonios',
        querystring: localeQuerystring,
        response: { 200: testimonialListSchema, ...errors },
      },
    },
    controller.listTestimonials
  );
};

/**
 * Módulo de rutas del CMS que consume el bootstrap.
 */
export const cmsRouteModule: RouteModule = {
  name: 'CMS',
  prefix: '',
  routes: cmsRoutes,
};
