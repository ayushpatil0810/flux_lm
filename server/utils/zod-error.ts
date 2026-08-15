import { flattenError, type ZodError } from "zod";

/**
 * Extracts and flattens field-level validation errors from a ZodError object.
 *
 * @param error - The Zod error object returned by safeParse validation failure.
 * @returns An object mapping field names to arrays of error messages.
 */
export function getZodFieldErrors(error: ZodError) {
  return flattenError(error).fieldErrors;
}
