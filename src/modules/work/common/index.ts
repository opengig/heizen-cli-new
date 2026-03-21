import chalk from 'chalk';
import {
  getWorklogCookie,
  getWorklogUserData,
  clearWorklogAuth,
} from '../../../db/repositories/worklog-auth.repository.js';

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function getDateRangeForDay(daysAgo: number): {
  start: string;
  end: string;
  displayDate: string;
} {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  const end = new Date(d);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const displayDate = `${day}-${month}-${year}`;
  return { start, end: end.toISOString(), displayDate };
}

export async function requireWorklogAuth(): Promise<{ cookie: string; userId: string }> {
  const cookie = await getWorklogCookie();
  if (!cookie) {
    console.error(chalk.red('Run hz work login to sign in.'));
    process.exit(2);
  }
  const userData = await getWorklogUserData();
  if (!userData?.userId) {
    console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
    await clearWorklogAuth();
    process.exit(2);
  }
  return { cookie, userId: userData.userId };
}
