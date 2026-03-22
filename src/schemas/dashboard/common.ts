import { z } from 'zod';

/** API error response */
export const ApiErrorSchema = z.object({
  message: z.string().optional(),
  statusCode: z.number().optional(),
  error: z.string().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
