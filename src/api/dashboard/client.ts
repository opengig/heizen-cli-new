import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const BASE_URL = 'https://api.studio.heizen.work';

export type DashboardServiceClient = {
  request<T = unknown>(path: string, config?: Omit<AxiosRequestConfig, 'url'>): Promise<T>;
};

export function createDashboardServiceClient(token: string): DashboardServiceClient {
  const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: authToken,
      Accept: 'application/json',
    },
  });

  return {
    async request<T>(path: string, config?: Omit<AxiosRequestConfig, 'url'>): Promise<T> {
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
    },
  };
}
