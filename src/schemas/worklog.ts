import { z } from 'zod';

/** Single worklog entry (inferred from API usage) */
export const WorklogEntrySchema = z.object({
  id: z.string().optional(),
  projectId: z.string(),
  userId: z.string(),
  taskPhase: z.string(),
  workLogType: z.string(),
  hoursWorked: z.number(),
  notes: z.string().optional().nullable(),
  date: z.string(),
  project: z
    .object({
      id: z.string(),
      title: z.string().optional(),
    })
    .optional(),
});

/** Response from POST /action/get-worklogs */
export const GetWorklogsResponseSchema = z.union([
  z.array(WorklogEntrySchema),
  z.object({
    worklogs: z.array(WorklogEntrySchema).optional(),
    data: z.array(WorklogEntrySchema).optional(),
  }),
]);

/** Project from user.data (worklog projects - different IDs from dashboard) */
export const WorklogProjectSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  name: z.string().optional(),
});

/** Response from GET /dashboard/user.data - may be array or object with projects */
export const UserDataResponseSchema = z.union([
  z.array(z.any()),
  z.object({
    projects: z.array(WorklogProjectSchema).optional(),
    user: z
      .object({
        projects: z.array(WorklogProjectSchema).optional(),
      })
      .optional(),
  }),
]);

/** Request body for adding worklog (POST /dashboard/user.data?index) */
export const AddWorklogRequestSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  taskPhase: z.string(),
  workLogType: z.string(),
  hoursWorked: z.number().positive(),
  notes: z.string().optional(),
  date: z.string(),
});

export type WorklogEntry = z.infer<typeof WorklogEntrySchema>;
export type GetWorklogsResponse = z.infer<typeof GetWorklogsResponseSchema>;
export type WorklogProject = z.infer<typeof WorklogProjectSchema>;
export type UserDataResponse = z.infer<typeof UserDataResponseSchema>;
export type AddWorklogRequest = z.infer<typeof AddWorklogRequestSchema>;
