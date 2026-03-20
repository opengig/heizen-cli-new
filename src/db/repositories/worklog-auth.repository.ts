import { getDb } from '../core.js';

export async function getWorklogCookie(): Promise<string> {
  const db = await getDb();
  return db.data.worklogAuth?.cookie ?? '';
}

export async function getWorklogUserData(): Promise<{
  userId: string;
  projects: unknown[];
} | null> {
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
