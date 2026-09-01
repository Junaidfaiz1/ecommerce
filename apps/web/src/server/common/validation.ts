import { ZodError, type ZodType } from 'zod';
import { ValidationError } from './errors';

/**
 * Parse input with Zod. On failure throw ValidationError with field map
 * suitable for GraphQL `extensions.fields`.
 */
export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  throw zodToValidationError(result.error);
}

export function zodToValidationError(error: ZodError): ValidationError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!fields[path]) {
      fields[path] = issue.message;
    }
  }
  return new ValidationError('Validation failed.', fields);
}
