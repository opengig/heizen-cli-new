import { getProjects } from './controllers/projects.controller.js';
import { getSprintBoard } from './controllers/sprint.controller.js';
import { getStory, updateStory } from './controllers/story.controller.js';
import { createDashboardServiceClient } from './client.js';

export const projects = {
  get: getProjects,
};

export const sprint = {
  getBoard: getSprintBoard,
};

export const story = {
  get: getStory,
  update: updateStory,
};

export function createDashboardClient(token: string) {
  const serviceClient = createDashboardServiceClient(token);

  return {
    getProjects: (active?: boolean) => getProjects(serviceClient, active),
    getSprintBoard: (sprintId: string) => getSprintBoard(serviceClient, sprintId),
    getStory: (storyId: string) => getStory(serviceClient, storyId),
    updateStory: (story: Parameters<typeof updateStory>[1]) => updateStory(serviceClient, story),
  };
}
