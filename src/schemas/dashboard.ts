import { z } from 'zod';

/** User reference (assignee, creator) */
const UserRefSchema = z.object({
  id: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().optional().nullable(),
  email: z.string().optional(),
});

/** Project reference in story */
const ProjectRefSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  uniqueName: z.string().optional(),
});

/** Sprint reference */
const SprintRefSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

/** Task reference */
const TaskRefSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  type: z.string().optional(),
});

/** User story - full object for GET/PUT (from test.ts PUT body) */
export const UserStorySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sprintId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  estimation: z.number().optional().nullable(),
  order: z.number().nullable().optional(),
  storyNumber: z.number().optional(),
  figmaImages: z.array(z.any()).optional(),
  acceptanceCriteria: z.array(z.any()).optional(),
  status: z.string(),
  assignedTo: z.string().optional().nullable(),
  priority: z.number().optional(),
  assignee: UserRefSchema.optional().nullable(),
  creator: UserRefSchema.optional().nullable(),
  testCases: z.array(z.any()).optional(),
  storyGithubPRs: z.array(z.any()).optional(),
  project: ProjectRefSchema.optional(),
  sprint: SprintRefSchema.optional(),
  task: TaskRefSchema.optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** Sprint (from Project.sprints) */
export const SprintSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type Sprint = z.infer<typeof SprintSchema>;

/** Dashboard project (from GET /projects) - may include sprints */
export const DashboardProjectSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  uniqueName: z.string().optional(),
  active: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  sprints: z.array(SprintSchema).optional(),
});

/** Response from GET /projects */
export const ProjectsResponseSchema = z.union([
  z.array(DashboardProjectSchema),
  z.object({
    projects: z.array(DashboardProjectSchema).optional(),
    data: z.array(DashboardProjectSchema).optional(),
  }),
]);

/** Sprint board column (legacy) */
export const SprintBoardColumnSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  status: z.string().optional(),
  stories: z.array(UserStorySchema).optional(),
  tasks: z.array(z.any()).optional(),
});

/** FeatureTask - task with stories (sprint board response) */
export const FeatureTaskSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  storyStatus: z.string().optional(),
  sprintId: z.string().optional(),
  projectId: z.string().optional(),
  stories: z.array(UserStorySchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type FeatureTask = z.infer<typeof FeatureTaskSchema>;

/** Response from GET /tasks/sprint-board/{sprintId} - array of FeatureTask or legacy format */
export const SprintBoardResponseSchema = z.union([
  z.array(FeatureTaskSchema),
  z.object({
    columns: z.array(SprintBoardColumnSchema).optional(),
    sprint: z
      .object({
        id: z.string(),
        name: z.string().optional(),
      })
      .optional(),
  }),
  z.array(SprintBoardColumnSchema),
]);

/** API error response */
export const ApiErrorSchema = z.object({
  message: z.string().optional(),
  statusCode: z.number().optional(),
  error: z.string().optional(),
});

export type UserStory = z.infer<typeof UserStorySchema>;
export type DashboardProject = z.infer<typeof DashboardProjectSchema>;
export type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;
export type SprintBoardColumn = z.infer<typeof SprintBoardColumnSchema>;
export type SprintBoardResponse = z.infer<typeof SprintBoardResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
