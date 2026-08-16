import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp, closeTestApp } from '../helpers/build-app';
import { adminHeaders } from '../helpers/auth';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { skillModel } from '@infrastructure/dbs/models/mongodb/skill';

interface SiteSettingsBody {
  locale: string;
  siteName: string;
}

interface HeroBody {
  locale: string;
  greeting: string;
}

interface AboutBody {
  locale: string;
  eduContent: string;
}

interface SkillBody {
  _id?: string;
  name: string;
  category: string;
  published?: boolean;
}

interface ExperienceBody {
  locale: string;
  company: string;
  published?: boolean;
}

interface TestimonialBody {
  locale: string;
  author: string;
}

/**
 * Pruebas funcionales de las lecturas públicas del CMS contra la MongoDB
 * local: singletons por locale con el literal null cuando no existe
 * documento, y listados de skills, experiencias y testimonios con sus
 * filtros de querystring.
 */
describe('lecturas públicas del CMS', () => {
  let app: FastifyInstance;
  let headers: { authorization: string };

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    headers = await adminHeaders(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('site-settings sin locale responde el singleton es por defecto', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/cms/site-settings',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<SiteSettingsBody>();
    expect(body.locale).toBe('es');
    expect(typeof body.siteName).toBe('string');
    expect(body.siteName.length).toBeGreaterThan(0);
  });

  it('site-settings con locale en responde el singleton en', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/cms/site-settings?locale=en',
      headers,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json<SiteSettingsBody>().locale).toBe('en');
  });

  it('site-settings de un locale sin documento responde el literal null con 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/cms/site-settings?locale=de',
      headers,
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('null');
    expect(response.json()).toBeNull();
  });

  it('hero responde el singleton es', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/cms/hero', headers });
    expect(response.statusCode).toBe(200);
    const body = response.json<HeroBody>();
    expect(body.locale).toBe('es');
    expect(typeof body.greeting).toBe('string');
  });

  it('about responde el singleton es con eduContent como cadena JSON', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/cms/about', headers });
    expect(response.statusCode).toBe(200);
    const body = response.json<AboutBody>();
    expect(body.locale).toBe('es');
    expect(typeof body.eduContent).toBe('string');
  });

  it('skills omite del listado por defecto una skill despublicada', async () => {
    const model = skillModel(DatabaseConnector.getPortfolioDb());
    const draft = await model.create({
      name: 'fixture-skill-despublicada',
      category: 'fixture',
      icon: 'fixture',
      order: 999,
      published: false,
    });

    try {
      const listed = await app.inject({ method: 'GET', url: '/api/v1/cms/skills', headers });
      const names = listed.json<SkillBody[]>().map(skill => skill.name);
      expect(names).not.toContain('fixture-skill-despublicada');

      const drafts = await app.inject({
        method: 'GET',
        url: '/api/v1/cms/skills?published=false',
        headers,
      });
      expect(drafts.json<SkillBody[]>().map(skill => skill.name)).toContain(
        'fixture-skill-despublicada'
      );
    } finally {
      await model.deleteOne({ _id: draft._id });
    }
  });

  it('skills responde solo las publicadas por defecto, con nombre y categoría', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/cms/skills', headers });
    expect(response.statusCode).toBe(200);
    const skills = response.json<SkillBody[]>();
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every(skill => skill.published === undefined)).toBe(true);
    expect(skills.every(skill => typeof skill.name === 'string' && skill.name.length > 0)).toBe(
      true
    );
    expect(
      skills.every(skill => typeof skill.category === 'string' && skill.category.length > 0)
    ).toBe(true);
  });

  it('skills con published=false responde solo despublicadas', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/cms/skills?published=false',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const skills = response.json<SkillBody[]>();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.every(skill => !skill.published)).toBe(true);
  });

  it('skills filtra por categoría', async () => {
    const all = await app.inject({ method: 'GET', url: '/api/v1/cms/skills', headers });
    const category = all.json<SkillBody[]>()[0]?.category;
    expect(category).toBeDefined();

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/cms/skills?category=${encodeURIComponent(category ?? '')}`,
      headers,
    });
    expect(response.statusCode).toBe(200);
    const skills = response.json<SkillBody[]>();
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.every(skill => skill.category === category)).toBe(true);
  });

  it('experiences responde el listado es publicado', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/cms/experiences', headers });
    expect(response.statusCode).toBe(200);
    const experiences = response.json<ExperienceBody[]>();
    expect(experiences.length).toBeGreaterThan(0);
    expect(experiences.every(experience => experience.locale === 'es')).toBe(true);
    expect(experiences.every(experience => experience.published === undefined)).toBe(true);
  });

  it('experiences con locale en responde el listado en', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/cms/experiences?locale=en',
      headers,
    });
    expect(response.statusCode).toBe(200);
    const experiences = response.json<ExperienceBody[]>();
    expect(experiences.every(experience => experience.locale === 'en')).toBe(true);
  });

  it('testimonials responde el listado es', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/cms/testimonials', headers });
    expect(response.statusCode).toBe(200);
    const testimonials = response.json<TestimonialBody[]>();
    expect(Array.isArray(testimonials)).toBe(true);
    expect(testimonials.every(testimonial => testimonial.locale === 'es')).toBe(true);
  });
});
