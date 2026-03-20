import { getDb } from '../core.js';

export async function getRecentWorklogProjects(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  return db.data.recentWorklogProjects ?? [];
}

export async function addToRecentWorklogProjects(project: { id: string; name: string }): Promise<void> {
  const db = await getDb();
  const current = db.data.recentWorklogProjects ?? [];
  const filtered = current.filter((p) => p.id !== project.id);
  const updated = [project, ...filtered].slice(0, 10);
  db.data.recentWorklogProjects = updated;
  await db.write();
}
