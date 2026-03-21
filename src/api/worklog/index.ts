import { getWorklogs, addWorklog } from './controllers/worklogs.controller.js';
import { getUserData } from './controllers/user.controller.js';
import { createWorklogServiceClient, worklogLogin } from './client.js';
import { AddWorklogRequest } from '../../schemas/worklog.js';

export const auth = {
  login: worklogLogin,
};

export const worklogs = {
  get: getWorklogs,
  add: addWorklog,
};

export const user = {
  getData: getUserData,
};

export function createWorklogClient(cookie: string, onUnauthorized?: () => void | Promise<void>) {
  const serviceClient = createWorklogServiceClient(cookie, onUnauthorized);

  return {
    getWorklogs: (params: { startDate: string; endDate: string; userId: string }) => getWorklogs(serviceClient, params),
    getUserData: () => getUserData(serviceClient),
    addWorklog: (req: AddWorklogRequest) => addWorklog(serviceClient, req),
  };
}

export { worklogLogin };
