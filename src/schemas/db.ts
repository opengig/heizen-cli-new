import { z } from 'zod';

export const WorkStatusSchema = z.enum(['active', 'paused', 'done']);
export type WorkStatus = z.infer<typeof WorkStatusSchema>;

export const WorkSchema = z.object({
  id: z.string(),
  name: z.string(),
  startTime: z.number(),
  pauseTimes: z.array(z.object({ at: z.number() })),
  resumeTimes: z.array(z.object({ at: z.number() })),
  endTime: z.number().optional(),
  status: WorkStatusSchema,
  storyId: z.string().optional(),
});
export type Work = z.infer<typeof WorkSchema>;

export const WorkspaceStateSchema = z.object({
  linkedProjectId: z.string().optional(),
  linkedWorklogProjectId: z.string().optional(),
  activeSprintId: z.string().optional(),
});
export type WorkspaceState = z.infer<typeof WorkspaceStateSchema>;

export const DbSchema = z.object({
  version: z.number().default(1),
  works: z.array(WorkSchema),
  workspaces: z.record(z.string(), WorkspaceStateSchema),
  projectsCache: z
    .object({
      fetchedAt: z.number(),
      projects: z.array(z.any()),
    })
    .optional(),
});
export type Db = z.infer<typeof DbSchema>;

export const DEFAULT_DB: Db = {
  version: 1,
  works: [],
  workspaces: {},
};
