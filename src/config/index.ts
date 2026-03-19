/**
 * Config loader - reads auth from environment variables.
 * Supports HEIZEN_* or legacy names for compatibility.
 */

export function getWorklogCookie(): string {
  const cookie =
    process.env.HEIZEN_WORKLOG_COOKIE ?? process.env.WORKLOG_COOKIE ?? '';
  return cookie;
}

export function getDashboardToken(): string {
  const token =
    process.env.HEIZEN_DASHBOARD_TOKEN ?? process.env.DASHBOARD_TOKEN ?? '';
  return token;
}

export function requireWorklogAuth(): string {
  const cookie = getWorklogCookie();
  if (!cookie) {
    throw new Error(
      'Worklog auth required. Set HEIZEN_WORKLOG_COOKIE or WORKLOG_COOKIE in .env'
    );
  }
  return cookie;
}

export function requireDashboardAuth(): string {
  const token = getDashboardToken();
  if (!token) {
    throw new Error(
      'Dashboard auth required. Set HEIZEN_DASHBOARD_TOKEN or DASHBOARD_TOKEN in .env'
    );
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
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    );
    return decoded?.user?.id ?? null;
  } catch {
    return null;
  }
}
