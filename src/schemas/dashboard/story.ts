import { z } from 'zod';

/** User reference (assignee, creator) */
const UserRefSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
  email: z.string(),
});

/** Project reference in story */
const ProjectRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  uniqueName: z.string(),
});

/** Sprint reference */
const SprintRefSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** Task reference */
const TaskRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
});

const StoryStatusSchema = z.enum(['Done', 'InReview', 'Todo', 'InProgress', 'In Progress']);

/** User story - full object for GET /tasks/user-stories/story/{id} and sprint board */
export const UserStorySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sprintId: z.string().nullable(),
  title: z.string(),
  description: z.string(),
  estimation: z.number(),
  order: z.number().nullable(),
  storyNumber: z.number(),
  figmaImages: z.array(z.any()),
  acceptanceCriteria: z.array(z.union([z.string(), z.object({ criteria: z.string(), isCompleted: z.boolean() })])),
  status: StoryStatusSchema,
  assignedTo: z.string().nullable(),
  priority: z.number(),
  assignee: UserRefSchema.nullable(),
  creator: UserRefSchema.nullable(),
  testCases: z.array(z.any()),
  storyGithubPRs: z.array(z.any()),
  project: ProjectRefSchema,
  sprint: SprintRefSchema.nullable(),
  task: TaskRefSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserStory = z.infer<typeof UserStorySchema>;

/** FeatureTask - task with stories (sprint board response) */
export const FeatureTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  storyStatus: z.string(),
  sprintId: z.string(),
  projectId: z.string(),
  stories: z.array(UserStorySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FeatureTask = z.infer<typeof FeatureTaskSchema>;

/** Response from GET /tasks/sprint-board/{sprintId} - array of FeatureTask */
export const SprintBoardResponseSchema = z.array(FeatureTaskSchema);

export type SprintBoardResponse = z.infer<typeof SprintBoardResponseSchema>;
