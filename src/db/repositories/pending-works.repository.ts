import { getDb, getWorkspaceKey } from '../core.js';
import type { PendingWork } from '../../schemas/db.js';

export async function getPendingWorks(): Promise<PendingWork[]> {
  const db = await getDb();
  const key = getWorkspaceKey();
  const ws = db.data.workspaces[key];
  return ws?.pendingWorks ?? [];
}

export async function addPendingWork(work: PendingWork): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  const works = db.data.workspaces[key].pendingWorks ?? [];
  works.push(work);
  db.data.workspaces[key].pendingWorks = works;
  await db.write();
}

export async function removePendingWork(id: string): Promise<boolean> {
  const db = await getDb();
  const key = getWorkspaceKey();
  const ws = db.data.workspaces[key];
  if (!ws?.pendingWorks) return false;
  const idx = ws.pendingWorks.findIndex((w) => w.id === id);
  if (idx < 0) return false;
  ws.pendingWorks.splice(idx, 1);
  await db.write();
  return true;
}

export async function findPendingWorkByHashPrefix(prefix: string): Promise<PendingWork | null> {
  const works = await getPendingWorks();
  return works.find((w) => w.id.startsWith(prefix)) ?? null;
}
