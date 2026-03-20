import { z } from 'zod';

// ─── Projects endpoint (GET /projects?active=false) ─────────────────────────

export const ProjectRoleSchema = z.enum([
  'Admin',
  'Developer',
  'Manager',
  'Client',
  'Designer',
]);
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;

export const SprintStatusSchema = z.enum(['Completed', 'Active', 'Paused', 'Not Started']);
export type SprintStatus = z.infer<typeof SprintStatusSchema>;

export const HealthStatusSchema = z.enum(['on-track', 'at-risk', 'inactive']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const ProjectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  role: ProjectRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  email: z.string(),
  userId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const ProjectHealthSchema = z.object({
  status: HealthStatusSchema,
  color: z.string(),
  label: z.string(),
  bgColor: z.string(),
  activeSprintCount: z.number(),
  overdueSprints: z.number(),
  soonDueSprints: z.number(),
});
export type ProjectHealth = z.infer<typeof ProjectHealthSchema>;

/** Sprint (from Project.sprints) */
export const SprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: SprintStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
});
export type Sprint = z.infer<typeof SprintSchema>;

/** Dashboard project (from GET /projects) */
export const DashboardProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  logoUrl: z.string().nullable(),
  isArchived: z.boolean(),
  projectMembers: z.array(ProjectMemberSchema),
  sprints: z.array(SprintSchema),
  uniqueName: z.string(),
  updatedAt: z.string(),
  health: ProjectHealthSchema,
});
export type DashboardProject = z.infer<typeof DashboardProjectSchema>;

/** Response from GET /projects - array of Projects */
export const ProjectsResponseSchema = z.array(DashboardProjectSchema);

// ─── Sprint board & User story endpoints ────────────────────────────────────

/** User reference (assignee, creator) */
const UserRefSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string(),
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

const StoryStatusSchema = z.enum([
  'Done',
  'InReview',
  'Todo',
  'InProgress',
  'In Progress',
]);

/** User story - full object for GET /tasks/user-stories/story/{id} and sprint board */
export const UserStorySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sprintId: z.string(),
  title: z.string(),
  description: z.string(),
  estimation: z.number(),
  order: z.number().nullable(),
  storyNumber: z.number(),
  figmaImages: z.array(z.any()),
  acceptanceCriteria: z.array(z.string()),
  status: StoryStatusSchema,
  assignedTo: z.string(),
  priority: z.number(),
  assignee: UserRefSchema,
  creator: UserRefSchema,
  testCases: z.array(z.any()),
  storyGithubPRs: z.array(z.any()),
  project: ProjectRefSchema,
  sprint: SprintRefSchema,
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

/** API error response */
export const ApiErrorSchema = z.object({
  message: z.string().optional(),
  statusCode: z.number().optional(),
  error: z.string().optional(),
});

export type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;
export type SprintBoardResponse = z.infer<typeof SprintBoardResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
