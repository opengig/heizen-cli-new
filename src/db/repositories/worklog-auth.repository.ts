import { getDb } from '../core.js';
import {
  getWorklogCookie as getWorklogCookieFromCredentials,
  setWorklogCookie,
  deleteWorklogCookie,
} from '../../credentials/index.js';

export async function getWorklogCookie(): Promise<string> {
  return getWorklogCookieFromCredentials();
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

export async function setWorklogAuth(
  cookie: string,
  userData: { userId: string; projects: unknown[] }
): Promise<{ usedKeytar: boolean }> {
  const { usedKeytar } = await setWorklogCookie(cookie);
  const db = await getDb();
  db.data.worklogAuth = {
    cookie: usedKeytar ? '' : cookie,
    userData,
    fetchedAt: Date.now(),
  };
  await db.write();
  return { usedKeytar };
}

export async function clearWorklogAuth(): Promise<void> {
  await deleteWorklogCookie();
  const db = await getDb();
  db.data.worklogAuth = undefined;
  await db.write();
}
