/**
 * Typed fetch client for the Flux REST API route handlers.
 *
 * Every endpoint responds with a uniform envelope:
 *   success -> { success: true, message?, data }
 *   failure -> { success: false, error, details? }
 *
 * `apiFetch` unwraps `data` on success and throws an `ApiClientError`
 * carrying the HTTP status, the server error message, and any zod
 * field-error details on failure.
 */

export class ApiClientError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}

interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
  details?: unknown;
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type ApiFetchOptions = Omit<RequestInit, "body"> & {
  /** JSON-serializable request body. Sets Content-Type automatically. */
  json?: unknown;
  /** Multipart body (e.g. PDF import). The browser sets the boundary. */
  formData?: FormData;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, formData, headers, ...init } = options;

  const finalHeaders = new Headers(headers);
  let body: BodyInit | undefined;

  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  } else if (formData !== undefined) {
    body = formData;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: finalHeaders,
      body,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiClientError(
      0,
      "Network request failed. Check your connection and try again.",
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok) {
    if (envelope && envelope.success === false) {
      throw new ApiClientError(
        response.status,
        envelope.error,
        envelope.details,
      );
    }
    throw new ApiClientError(
      response.status,
      `Request failed with status ${response.status}.`,
    );
  }

  if (!envelope || envelope.success !== true) {
    throw new ApiClientError(
      response.status,
      "Received an unexpected response from the server.",
    );
  }

  return envelope.data;
}

/**
 * Normalizes zod field-error details from a 400 response into a
 * field-name -> first message map for inline form rendering.
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (
    error instanceof ApiClientError &&
    error.details !== null &&
    typeof error.details === "object"
  ) {
    const entries = Object.entries(error.details as Record<string, unknown>)
      .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
      .map(([field, messages]) => [field, String((messages as unknown[])[0])]);
    return Object.fromEntries(entries);
  }
  return {};
}

/** Extracts a human-readable message from any thrown value. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Default retry policy for queries: 4xx responses are never retried
 * (they will not succeed on their own), transient failures twice.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (
    error instanceof ApiClientError &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }
  return failureCount < 2;
}
