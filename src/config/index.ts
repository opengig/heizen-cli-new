/**
 * Config loader - reads auth from credential storage (keytar/db).
 */

import { getDashboardToken } from '../credentials/index.js';

export async function requireDashboardAuth(): Promise<string> {
  const token = await getDashboardToken();
  if (!token) {
    throw new Error('Dashboard auth required. Run hz token to sign in.');
  }
  return token;
}

/** Extract userId from worklog cookie (_auth payload) if present */
export function getWorklogUserIdFromCookie(cookie: string): string | null {
  const match = cookie.match(/_auth=([^;]+)/);
  if (!match) return null;
  try {
    const [payload] = match[1].split('.');
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    return decoded?.user?.id ?? null;
  } catch {
    return null;
  }
}
