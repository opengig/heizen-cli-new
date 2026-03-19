import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { JSONFilePreset } from 'lowdb/node';
import type { Db, Work, WorkspaceState, PendingWork } from '../schemas/db.js';
import { DEFAULT_DB } from '../schemas/db.js';

const DB_DIR = path.join(os.homedir(), '.hz');
const DB_PATH = path.join(DB_DIR, 'db.json');

let dbPromise: Promise<{ data: Db; read: () => Promise<void>; write: () => Promise<void> }> | null = null;

export async function getDb() {
  if (!dbPromise) {
    await fs.promises.mkdir(DB_DIR, { recursive: true });
    dbPromise = JSONFilePreset<Db>(DB_PATH, DEFAULT_DB);
  }
  return dbPromise;
}

export function getWorkspaceKey(): string {
  return process.cwd();
}

export async function addWork(work: Omit<Work, 'pauseTimes' | 'resumeTimes'>): Promise<Work> {
  const fullWork: Work = {
    ...work,
    pauseTimes: [],
    resumeTimes: [],
  };
  const db = await getDb();
  db.data.works.push(fullWork);
  await db.write();
  return fullWork;
}

export async function getWorks(includeDone = false): Promise<Work[]> {
  const db = await getDb();
  if (includeDone) return [...db.data.works];
  return db.data.works.filter((w) => w.status !== 'done');
}

export async function getWorkByIndex(index: number, includeDone = false): Promise<Work | null> {
  const works = await getWorks(includeDone);
  const i = index - 1;
  if (i < 0 || i >= works.length) return null;
  return works[i];
}

export async function pauseWork(index: number): Promise<Work | null> {
  const work = await getWorkByIndex(index);
  if (!work || work.status !== 'active') return null;
  const db = await getDb();
  const w = db.data.works.find((x) => x.id === work.id);
  if (!w) return null;
  w.pauseTimes.push({ at: Date.now() });
  w.status = 'paused';
  await db.write();
  return w;
}

export async function resumeWork(index: number): Promise<Work | null> {
  const work = await getWorkByIndex(index);
  if (!work || work.status !== 'paused') return null;
  const db = await getDb();
  const w = db.data.works.find((x) => x.id === work.id);
  if (!w) return null;
  w.resumeTimes.push({ at: Date.now() });
  w.status = 'active';
  await db.write();
  return w;
}

export async function removeWork(index: number): Promise<boolean> {
  const work = await getWorkByIndex(index);
  if (!work || work.status === 'done') return false;
  const db = await getDb();
  const i = db.data.works.findIndex((x) => x.id === work.id);
  if (i < 0) return false;
  db.data.works.splice(i, 1);
  await db.write();
  return true;
}

export async function completeWork(index: number): Promise<Work | null> {
  const work = await getWorkByIndex(index);
  if (!work || work.status === 'done') return null;
  const db = await getDb();
  const w = db.data.works.find((x) => x.id === work.id);
  if (!w) return null;
  w.endTime = Date.now();
  w.status = 'done';
  await db.write();
  return w;
}

export function computeWorkDuration(work: Work): number {
  let total = 0;
  let lastResume = work.startTime;
  for (let i = 0; i < work.pauseTimes.length; i++) {
    total += work.pauseTimes[i].at - lastResume;
    lastResume = work.resumeTimes[i]?.at ?? work.endTime ?? Date.now();
  }
  total += (work.endTime ?? Date.now()) - lastResume;
  return total / (1000 * 60 * 60);
}

export async function getWorkspaceState(): Promise<WorkspaceState> {
  const db = await getDb();
  const key = getWorkspaceKey();
  return db.data.workspaces[key] ?? {};
}

export async function setLinkedProject(projectId: string): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].linkedProjectId = projectId;
  await db.write();
}

export async function setLinkedWorklogProject(projectOrId: string | { id: string; name: string }): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  const project = typeof projectOrId === 'string' ? { id: projectOrId, name: projectOrId } : projectOrId;
  db.data.workspaces[key].linkedWorklogProjectId = project.id;
  db.data.workspaces[key].linkedWorklogProject = project;
  await db.write();
}

export async function setActiveSprint(sprintId: string): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].activeSprintId = sprintId;
  await db.write();
}

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

// --- Worklog auth (stored in db, not env) ---

export async function getWorklogCookie(): Promise<string> {
  const db = await getDb();
  return db.data.worklogAuth?.cookie ?? '';
}

export async function getWorklogUserData(): Promise<{ userId: string; projects: unknown[] } | null> {
  const db = await getDb();
  const auth = db.data.worklogAuth;
  if (!auth?.userData) return null;
  return auth.userData;
}

export async function setWorklogAuth(cookie: string, userData: { userId: string; projects: unknown[] }): Promise<void> {
  const db = await getDb();
  db.data.worklogAuth = { cookie, userData, fetchedAt: Date.now() };
  await db.write();
}

export async function clearWorklogAuth(): Promise<void> {
  const db = await getDb();
  db.data.worklogAuth = undefined;
  await db.write();
}

// --- Recent worklog projects (last 10) ---

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

// --- Linked worklog project (active project per workspace) ---

export async function getLinkedWorklogProject(): Promise<{ id: string; name: string } | null> {
  const db = await getDb();
  const key = getWorkspaceKey();
  const ws = db.data.workspaces[key];
  if (ws?.linkedWorklogProject) return ws.linkedWorklogProject;
  if (ws?.linkedWorklogProjectId) {
    return { id: ws.linkedWorklogProjectId, name: ws.linkedWorklogProjectId };
  }
  return null;
}

// --- Pending works ---

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
