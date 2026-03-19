import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import {
  ProjectsResponseSchema,
  SprintBoardResponseSchema,
  UserStorySchema,
  type DashboardProject,
  type FeatureTask,
  type SprintBoardColumn,
  type UserStory,
} from '../schemas/dashboard.js';

const BASE_URL = 'https://api.studio.heizen.work';

export function createDashboardClient(token: string) {
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: authToken,
      Accept: 'application/json',
    },
  });

  async function request<T>(path: string, config?: Omit<AxiosRequestConfig, 'url'>): Promise<T> {
    try {
      const res = await client.request<T>({ url: path, ...config });
      return res.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const msg = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
        throw new Error(`Dashboard API error ${err.response.status}: ${msg}`);
      }
      throw err;
    }
  }

  return {
    async getProjects(active?: boolean): Promise<DashboardProject[]> {
      const qs = active !== undefined ? `?active=${active}` : '?active=false';
      const raw = await request<unknown>(`/projects${qs}`);

      const parsed = ProjectsResponseSchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error.format());
        console.error('Raw response:', JSON.stringify(raw, null, 2));
        throw new Error('Invalid projects response format');
      }

      const data = parsed.data;
      if (Array.isArray(data)) return data as DashboardProject[];
      const obj = data as Record<string, unknown>;
      return (obj.projects ?? obj.data ?? []) as DashboardProject[];
    },

    async getSprintBoard(sprintId: string): Promise<{
      tasks: FeatureTask[];
      columns: SprintBoardColumn[];
      sprint?: { id: string; name?: string };
    }> {
      const raw = await request<unknown>(`/tasks/sprint-board/${sprintId}`);

      const parsed = SprintBoardResponseSchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error.format());
        console.error('Raw response:', JSON.stringify(raw, null, 2));
        throw new Error('Invalid sprint board response format');
      }

      const data = parsed.data;
      if (Array.isArray(data)) {
        const arr = data as unknown[];
        const asTasks = arr as FeatureTask[];
        const asColumns = arr as SprintBoardColumn[];
        return {
          tasks: asTasks,
          columns: asColumns,
          sprint: { id: sprintId },
        };
      }
      const obj = data as Record<string, unknown>;
      const columns = (obj.columns ?? []) as SprintBoardColumn[];
      const tasks: FeatureTask[] = columns.map((c) => ({
        id: c.id ?? '',
        title: c.title,
        stories: c.stories ?? [],
      }));
      return {
        tasks,
        columns,
        sprint: obj.sprint as { id: string; name?: string } | undefined,
      };
    },

    async getStory(storyId: string): Promise<UserStory> {
      const raw = await request<unknown>(`/tasks/user-stories/story/${storyId}`);

      const parsed = UserStorySchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error.format());
        console.error('Raw response:', JSON.stringify(raw, null, 2));
        throw new Error('Invalid story response format');
      }
      return parsed.data;
    },

    async updateStory(story: UserStory): Promise<UserStory> {
      const raw = await request<unknown>(`/tasks/user-stories/story/${story.id}`, {
        method: 'PUT',
        data: story,
        headers: { 'Content-Type': 'application/json' },
      });

      const parsed = UserStorySchema.safeParse(raw);
      if (!parsed.success) {
        console.error('Schema validation failed:', parsed.error.format());
        console.error('Raw response:', JSON.stringify(raw, null, 2));
        throw new Error('Invalid story update response format');
      }
      return parsed.data;
    },
  };
}

export type DashboardClient = ReturnType<typeof createDashboardClient>;
