import { ApiResponse } from "./api-response";

export function asyncHandler<T extends (...args: any[]) => Promise<Response>>(
  fn: T,
): T {
  return (async (...args: Parameters<T>): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      return ApiResponse.error(error);
    }
  }) as T;
}
