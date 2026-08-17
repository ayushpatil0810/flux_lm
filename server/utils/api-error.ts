export class ApiError extends Error {
  public statusCode: number;
  public errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errors?: unknown) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden access") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static tooManyRequests(message = "Too many requests. Please try again later.") {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, message);
  }
}
