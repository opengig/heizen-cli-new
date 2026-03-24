import type { DashboardServiceClient } from '../client.js';
import type { UserStory } from '../../../schemas/dashboard/index.js';

export async function getStory(client: DashboardServiceClient, storyId: string): Promise<UserStory> {
  const raw = await client.request<unknown>(`/tasks/user-stories/story/${storyId}`);

  if (raw === null || typeof raw !== 'object') {
    return {};
  }
  return raw as UserStory;
}

export async function updateStory(client: DashboardServiceClient, story: UserStory): Promise<UserStory> {
  if (!story.id) {
    throw new Error('Story update requires story id');
  }
  const raw = await client.request<unknown>(`/tasks/user-stories/story/${story.id}`, {
    method: 'PUT',
    data: story,
    headers: { 'Content-Type': 'application/json' },
  });

  if (raw === null || typeof raw !== 'object') {
    return {};
  }
  return raw as UserStory;
}
