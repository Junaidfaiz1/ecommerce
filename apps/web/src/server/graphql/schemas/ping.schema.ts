import { z } from 'zod';

export const pingArgsSchema = z.object({
  echo: z
    .string()
    .trim()
    .min(1, 'echo must not be empty')
    .max(200, 'echo must be at most 200 characters')
    .optional()
    .nullable(),
});

export type PingArgs = z.infer<typeof pingArgsSchema>;
