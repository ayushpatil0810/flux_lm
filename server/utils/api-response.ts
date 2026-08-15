import { NextResponse } from "next/server";
import { ApiError } from "./api-error";

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

    console.error("Unhandled Server Error:", error);

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
