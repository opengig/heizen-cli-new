import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const BASE_URL = 'https://worklog.opengig.work';

export type WorklogServiceClient = {
  request<T = unknown>(path: string, config?: Omit<AxiosRequestConfig, 'url'>): Promise<T>;
};

/** Login and return Set-Cookie header values */
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

  await res.json();

  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }
  const setCookie = res.headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

export function createWorklogServiceClient(
  cookie: string,
  onUnauthorized?: () => void | Promise<void>
): WorklogServiceClient {
  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Accept: 'application/json, text/plain, */*',
      Cookie: cookie,
    },
    withCredentials: true,
  });

  return {
    async request<T>(path: string, config?: Omit<AxiosRequestConfig, 'url'>): Promise<T> {
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
    },
  };
}
