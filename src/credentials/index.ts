/**
 * Credential storage - keytar (primary) with db.json fallback.
 * Uses system keychain on macOS, Secret Service on Linux, Credential Vault on Windows.
 */

import keytar from 'keytar';
import { getDb } from '../db/core.js';

const SERVICE = 'heizen-cli';
const ACCOUNT_DASHBOARD_TOKEN = 'dashboard-token';
const ACCOUNT_WORKLOG_COOKIE = 'worklog-cookie';

export async function getDashboardToken(): Promise<string> {
  try {
    const password = await keytar.getPassword(SERVICE, ACCOUNT_DASHBOARD_TOKEN);
    if (password) return password;
  } catch {
    // keytar failed, fallback to db
  }
  const db = await getDb();
  return db.data.dashboardToken ?? '';
}

export async function setDashboardToken(token: string): Promise<{ usedKeytar: boolean }> {
  try {
    await keytar.setPassword(SERVICE, ACCOUNT_DASHBOARD_TOKEN, token);
    return { usedKeytar: true };
  } catch {
    const db = await getDb();
    db.data.dashboardToken = token;
    await db.write();
    return { usedKeytar: false };
  }
}

export async function deleteDashboardToken(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE, ACCOUNT_DASHBOARD_TOKEN);
  } catch {
    // ignore
  }
  const db = await getDb();
  delete db.data.dashboardToken;
  await db.write();
}

export async function getWorklogCookie(): Promise<string> {
  try {
    const password = await keytar.getPassword(SERVICE, ACCOUNT_WORKLOG_COOKIE);
    if (password) return password;
  } catch {
    // keytar failed, fallback to db
  }
  const db = await getDb();
  return db.data.worklogAuth?.cookie ?? '';
}

export async function setWorklogCookie(cookie: string): Promise<{ usedKeytar: boolean }> {
  try {
    await keytar.setPassword(SERVICE, ACCOUNT_WORKLOG_COOKIE, cookie);
    return { usedKeytar: true };
  } catch {
    // keytar failed; caller (worklog-auth.repository) will persist cookie in db.data.worklogAuth
    return { usedKeytar: false };
  }
}

export async function deleteWorklogCookie(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE, ACCOUNT_WORKLOG_COOKIE);
  } catch {
    // ignore
  }
}
