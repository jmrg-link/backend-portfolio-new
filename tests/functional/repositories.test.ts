import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '@config/envs';
import { DatabaseConnector } from '@infrastructure/dbs/config/mongodb';
import { blogPostModel } from '@infrastructure/dbs/models/mongodb/blog';
import { projectModel } from '@infrastructure/dbs/models/mongodb/project';
import { skillModel } from '@infrastructure/dbs/models/mongodb/skill';
import { BlogRepository } from '@presentation/blog/repositories';
import { ProjectRepository } from '@presentation/projects/repositories';
import { SkillRepository } from '@presentation/cms/repositories';

/**
 * Pruebas funcionales de la capa de datos contra la MongoDB local con el
 * seed cargado: forma de las entidades, normalización de _id, proyección
 * meta de los listados y filtros de publicación.
 */
describe('repositorios sobre el seed local', () => {
  let blogRepository: BlogRepository;
  let projectRepository: ProjectRepository;
  let skillRepository: SkillRepository;

  beforeAll(async () => {
    await DatabaseConnector.initialize(env.mongo.uri);
    const db = DatabaseConnector.getPortfolioDb();
    blogRepository = new BlogRepository(blogPostModel(db));
    projectRepository = new ProjectRepository(projectModel(db));
    skillRepository = new SkillRepository(skillModel(db));
  });

  afterAll(async () => {
    await DatabaseConnector.disconnect();
  });

  it('blog.findPublished sin locale devuelve ambos idiomas sin content y con _id string', async () => {
    const posts = await blogRepository.findPublished();
    const entities = posts.map(post => post.toEntity());
    expect(entities.length).toBeGreaterThanOrEqual(2);
    expect(new Set(entities.map(post => post.locale))).toEqual(new Set(['es', 'en']));
    for (const entity of entities) {
      expect(entity.content).toBeUndefined();
      expect(typeof entity._id).toBe('string');
      expect(Array.isArray(entity.tags)).toBe(true);
    }
  });

  it('blog.findPublishedBySlug devuelve el post completo con content y readingTime', async () => {
    const post = await blogRepository.findPublishedBySlug('hola-mundo', 'es');
    expect(post).not.toBeNull();
    const entity = post?.toEntity();
    expect(typeof entity?.content).toBe('string');
    expect(entity?.readingTime).toBeGreaterThan(0);
  });

  it('projects.findPublished ordena por order asc y omite content', async () => {
    const projects = await projectRepository.findPublished({ locale: 'es' });
    const entities = projects.map(project => project.toEntity());
    expect(entities.map(project => project.slug)).toEqual([
      'pokedex-next',
      'poc-backend-kairosds',
      'stripe-payments',
    ]);
    for (const entity of entities) {
      expect(entity.content).toBeUndefined();
      expect(Array.isArray(entity.tech)).toBe(true);
    }
  });

  it('projects.findFeatured filtra published+featured', async () => {
    const projects = await projectRepository.findFeatured('en');
    expect(projects.length).toBe(3);
    for (const project of projects.map(item => item.toEntity())) {
      expect(project.featured).toBe(true);
      expect(project.published).toBe(true);
    }
  });

  it('projects.findRecent limita y conserva updatedAt para el dashboard', async () => {
    const projects = await projectRepository.findRecent(5);
    expect(projects.length).toBeLessThanOrEqual(5);
    for (const project of projects.map(item => item.toEntity())) {
      expect(project.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('skills.findFiltered por categoría respeta el orden interno', async () => {
    const skills = await skillRepository.findFiltered({ category: 'backend', published: true });
    const entities = skills.map(skill => skill.toEntity());
    expect(entities.length).toBe(10);
    expect(entities.map(skill => skill.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('las entidades exponen toEntityMap con las mismas claves que toEntity', async () => {
    const post = await blogRepository.findPublishedBySlug('hola-mundo', 'es');
    expect(post).not.toBeNull();
    if (post === null) return;
    const entity = post.toEntity();
    const map = post.toEntityMap();
    expect([...map.keys()].sort()).toEqual(Object.keys(entity).sort());
  });
});
