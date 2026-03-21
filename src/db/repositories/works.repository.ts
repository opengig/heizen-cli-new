import { getDb } from '../core.js';
import type { Work } from '../../schemas/db.js';

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
