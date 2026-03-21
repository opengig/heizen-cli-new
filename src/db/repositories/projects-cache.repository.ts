import { getDb } from '../core.js';

export async function cacheProjects(projects: unknown[]): Promise<void> {
  const db = await getDb();
  db.data.projectsCache = { fetchedAt: Date.now(), projects };
  await db.write();
}

export async function getCachedProjects(): Promise<unknown[] | null> {
  const db = await getDb();
  const cache = db.data.projectsCache;
  if (!cache) return null;
  const maxAge = 5 * 60 * 1000;
  if (Date.now() - cache.fetchedAt > maxAge) return null;
  return cache.projects;
}
