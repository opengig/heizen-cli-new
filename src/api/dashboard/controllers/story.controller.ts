import type { DashboardServiceClient } from '../client.js';
import { UserStorySchema, type UserStory } from '../../../schemas/dashboard/index.js';

export async function getStory(client: DashboardServiceClient, storyId: string): Promise<UserStory> {
  const raw = await client.request<unknown>(`/tasks/user-stories/story/${storyId}`);

  const parsed = UserStorySchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid story response format');
  }
  return parsed.data;
}

export async function updateStory(client: DashboardServiceClient, story: UserStory): Promise<UserStory> {
  const raw = await client.request<unknown>(`/tasks/user-stories/story/${story.id}`, {
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
}
