import path from 'node:path';
import os from 'node:os';
import { JSONFilePreset } from 'lowdb/node';
import type { Db, Work, WorkspaceState } from '../schemas/db.js';
import { DEFAULT_DB } from '../schemas/db.js';

const DB_DIR = path.join(os.homedir(), '.hz');
const DB_PATH = path.join(DB_DIR, 'db.json');

let dbPromise: Promise<{ data: Db; read: () => Promise<void>; write: () => Promise<void> }> | null = null;

export async function getDb() {
  if (!dbPromise) {
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
  const { data, write } = await getDb();
  data.works.push(fullWork);
  await write();
  return fullWork;
}

export async function getWorks(includeDone = false): Promise<Work[]> {
  const { data } = await getDb();
  if (includeDone) return [...data.works];
  return data.works.filter((w) => w.status !== 'done');
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
  const { data, write } = await getDb();
  const w = data.works.find((x) => x.id === work.id);
  if (!w) return null;
  w.pauseTimes.push({ at: Date.now() });
  w.status = 'paused';
  await write();
  return w;
}

export async function resumeWork(index: number): Promise<Work | null> {
  const work = await getWorkByIndex(index);
  if (!work || work.status !== 'paused') return null;
  const { data, write } = await getDb();
  const w = data.works.find((x) => x.id === work.id);
  if (!w) return null;
  w.resumeTimes.push({ at: Date.now() });
  w.status = 'active';
  await write();
  return w;
}

export async function removeWork(index: number): Promise<boolean> {
  const work = await getWorkByIndex(index);
  if (!work || work.status === 'done') return false;
  const { data, write } = await getDb();
  const i = data.works.findIndex((x) => x.id === work.id);
  if (i < 0) return false;
  data.works.splice(i, 1);
  await write();
  return true;
}

export async function completeWork(index: number): Promise<Work | null> {
  const work = await getWorkByIndex(index);
  if (!work || work.status === 'done') return null;
  const { data, write } = await getDb();
  const w = data.works.find((x) => x.id === work.id);
  if (!w) return null;
  w.endTime = Date.now();
  w.status = 'done';
  await write();
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
  const { data } = await getDb();
  const key = getWorkspaceKey();
  return data.workspaces[key] ?? {};
}

export async function setLinkedProject(projectId: string): Promise<void> {
  const { data, write } = await getDb();
  const key = getWorkspaceKey();
  if (!data.workspaces[key]) data.workspaces[key] = {};
  data.workspaces[key].linkedProjectId = projectId;
  await write();
}

export async function setLinkedWorklogProject(projectId: string): Promise<void> {
  const { data, write } = await getDb();
  const key = getWorkspaceKey();
  if (!data.workspaces[key]) data.workspaces[key] = {};
  data.workspaces[key].linkedWorklogProjectId = projectId;
  await write();
}

export async function setActiveSprint(sprintId: string): Promise<void> {
  const { data, write } = await getDb();
  const key = getWorkspaceKey();
  if (!data.workspaces[key]) data.workspaces[key] = {};
  data.workspaces[key].activeSprintId = sprintId;
  await write();
}

export async function cacheProjects(projects: unknown[]): Promise<void> {
  const { data, write } = await getDb();
  data.projectsCache = { fetchedAt: Date.now(), projects };
  await write();
}

export async function getCachedProjects(): Promise<unknown[] | null> {
  const { data } = await getDb();
  const cache = data.projectsCache;
  if (!cache) return null;
  const maxAge = 5 * 60 * 1000;
  if (Date.now() - cache.fetchedAt > maxAge) return null;
  return cache.projects;
}
