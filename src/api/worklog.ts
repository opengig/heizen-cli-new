import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { z } from 'zod';
import {
  GetWorklogsResponseSchema,
  AddWorklogRequestSchema,
  AddWorklogResponseSchema,
  WorklogProjectSchema,
  type AddWorklogRequest,
  type AddWorklogResponse,
  type WorklogEntry,
  type WorklogProject,
} from '../schemas/worklog.js';
import { parseFlight } from '../utils/parseFlight.js';

const BASE_URL = 'https://worklog.opengig.work';

/** Login and return Set-Cookie header values for use in HEIZEN_WORKLOG_COOKIE */
export async function worklogLogin(email: string, password: string): Promise<string[]> {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  const res = await fetch(`${BASE_URL}/login.data`, {
    method: 'POST',
    headers: { Accept: 'application/json, text/plain, */*' },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Worklog login failed ${res.status}: ${text}`);
  }

  await res.json(); // consume body

  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const setCookie = res.headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

export function createWorklogClient(cookie: string, onUnauthorized?: () => void | Promise<void>) {
  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Accept: 'application/json, text/plain, */*',
      Cookie: cookie,
    },
    withCredentials: true,
  });

  async function request<T>(path: string, config?: Omit<AxiosRequestConfig, 'url'>): Promise<T> {
    try {
      const res = await client.request<T>({ url: path, ...config });
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401 && onUnauthorized) {
          await onUnauthorized();
        }
        const msg = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
        throw new Error(`Worklog API error ${err.response.status}: ${msg}`);
      }
      throw err;
    }
  }

  return {
    async getWorklogs(params: { startDate: string; endDate: string; userId: string }): Promise<WorklogEntry[]> {
      const formData = new FormData();
      formData.append('startDate', params.startDate);
      formData.append('endDate', params.endDate);
      formData.append('userId', params.userId);

      const raw = await request<unknown>('/action/get-worklogs', {
        method: 'POST',
        data: formData,
      });

      const parsed = GetWorklogsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error.format());
        console.error('Raw response:', JSON.stringify(raw, null, 2));
        throw new Error('Invalid worklogs response format');
      }

      const data = parsed.data;
      if (Array.isArray(data)) return data as WorklogEntry[];
      if ('worklogs' in data && Array.isArray(data.worklogs)) return data.worklogs as WorklogEntry[];
      if ('data' in data && Array.isArray(data.data)) return data.data as WorklogEntry[];
      return [];
    },

    async getUserData(): Promise<{ userId: string; projects: WorklogProject[] }> {
      const raw = await request<unknown>('/dashboard/user.data');

      if (!Array.isArray(raw)) {
        return { userId: '', projects: [] };
      }

      let userId = '';
      let extractedProjects: unknown[] = [];
      try {
        const parsed = parseFlight<Record<string, unknown>>(raw);
        for (const item of parsed) {
          if (!item || typeof item !== 'object' || !('data' in item)) continue;
          const data = item.data;
          if (!data || typeof data !== 'object') continue;
          const d = data as Record<string, unknown>;
          if ('user' in d && d.user && typeof d.user === 'object') {
            const user = d.user as Record<string, unknown>;
            if (typeof user.id === 'string') userId = user.id;
          }
          if ('projects' in d && Array.isArray(d.projects)) {
            extractedProjects = d.projects;
          }
        }
      } catch {
        return { userId: '', projects: [] };
      }

      const validated = z.array(WorklogProjectSchema).safeParse(extractedProjects);
      if (!validated.success) {
        console.error('User data schema validation failed:', validated.error.format());
        return { userId, projects: [] };
      }
      return { userId, projects: validated.data };
    },

    async addWorklog(req: AddWorklogRequest): Promise<AddWorklogResponse> {
      AddWorklogRequestSchema.parse(req);

      const formData = new FormData();
      formData.append('projectId', req.projectId);
      formData.append('userId', req.userId);
      formData.append('taskPhase', req.taskPhase);
      formData.append('workLogType', req.workLogType);
      formData.append('hoursWorked', String(req.hoursWorked));
      if (req.notes) formData.append('notes', req.notes);
      formData.append('date', req.date);

      const raw = await request<unknown>('/dashboard/user.data?index', {
        method: 'POST',
        data: formData,
      });

      if (!Array.isArray(raw)) {
        throw new Error('Invalid add worklog response: expected flight format');
      }

      const parsed = parseFlight<Record<string, unknown>>(raw);
      const entry = parsed.find(
        (item) =>
          item &&
          typeof item === 'object' &&
          'data' in item &&
          item.data &&
          typeof item.data === 'object' &&
          'success' in (item.data as Record<string, unknown>)
      );

      if (!entry || !entry.data || typeof entry.data !== 'object') {
        throw new Error('Invalid add worklog response: could not find success in parsed flight');
      }

      const validated = AddWorklogResponseSchema.safeParse(entry);
      if (!validated.success) {
        console.error('Add worklog response validation failed:', validated.error.format());
        throw new Error('Invalid add worklog response format');
      }
      return validated.data;
    },
  };
}

export type WorklogClient = ReturnType<typeof createWorklogClient>;
