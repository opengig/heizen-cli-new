import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import {
  GetWorklogsResponseSchema,
  UserDataResponseSchema,
  AddWorklogRequestSchema,
  type AddWorklogRequest,
  type WorklogEntry,
  type WorklogProject,
} from '../schemas/worklog.js';

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

export function createWorklogClient(cookie: string) {
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

    async getUserData(): Promise<{ projects: WorklogProject[] }> {
      const raw = await request<unknown>('/dashboard/user.data');

      const parsed = UserDataResponseSchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error.format());
        console.error('Raw response:', JSON.stringify(raw, null, 2));
        throw new Error('Invalid user.data response format');
      }

      const data = parsed.data;
      let projects: WorklogProject[] = [];

      if (Array.isArray(data)) {
        projects = data
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .flatMap((item) => {
            const p = (item as { projects?: WorklogProject[] }).projects;
            return p ?? [];
          });
      } else if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        projects = (obj.projects as WorklogProject[]) ?? (obj.user as { projects?: WorklogProject[] })?.projects ?? [];
      }

      return { projects };
    },

    async addWorklog(req: AddWorklogRequest): Promise<unknown> {
      AddWorklogRequestSchema.parse(req);

      const formData = new FormData();
      formData.append('projectId', req.projectId);
      formData.append('userId', req.userId);
      formData.append('taskPhase', req.taskPhase);
      formData.append('workLogType', req.workLogType);
      formData.append('hoursWorked', String(req.hoursWorked));
      if (req.notes) formData.append('notes', req.notes);
      formData.append('date', req.date);

      return request<unknown>('/dashboard/user.data?index', {
        method: 'POST',
        data: formData,
      });
    },
  };
}

export type WorklogClient = ReturnType<typeof createWorklogClient>;
