import { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { ApiError } from "./api-error";

/**
 * Helper method to retrieve the currently authenticated user from session headers.
 *
 * @param req - Incoming NextRequest object containing headers.
 * @returns The authenticated User object.
 * @throws {ApiError} 401 Unauthorized if no active session is found.
 */
export async function getAuthenticatedUser(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session || !session.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  return session.user;
}
