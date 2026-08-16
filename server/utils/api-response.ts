import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { ApiError } from "./api-error";

const log = logger.child({ module: "ApiResponse" });


export class ApiResponse {
  static success<T>(data: T, message?: string, statusCode = 200) {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status: statusCode }
    );
  }

  static created<T>(data: T, message = "Resource created successfully") {
    return NextResponse.json(
      {
        success: true,
        message,
        data,
      },
      { status: 201 }
    );
  }

  static error(error: unknown) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.errors ?? null,
        },
        { status: error.statusCode }
      );
    }

    log.error({ err: error }, "Unhandled server error");

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
