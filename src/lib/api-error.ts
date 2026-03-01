/** @format */

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type ApiErrorPayload = {
  ok: false;
  error: string;
  code?: string;
};

export function handleApiError(
  error: unknown,
  fallbackMessage = "Server error",
) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P1001") {
      const payload: ApiErrorPayload = {
        ok: false,
        error:
          "Database unavailable. Please check DATABASE_URL / network and try again.",
        code: "DB_UNAVAILABLE",
      };
      return NextResponse.json(payload, { status: 503 });
    }

    const payload: ApiErrorPayload = {
      ok: false,
      error: `Database error: ${error.code}`,
      code: error.code,
    };
    return NextResponse.json(payload, { status: 500 });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    const payload: ApiErrorPayload = {
      ok: false,
      error:
        "Database initialization failed. Check env and connection settings.",
      code: "DB_INIT_FAILED",
    };
    return NextResponse.json(payload, { status: 503 });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    const payload: ApiErrorPayload = {
      ok: false,
      error: "Invalid database query payload.",
      code: "DB_VALIDATION",
    };
    return NextResponse.json(payload, { status: 400 });
  }

  const payload: ApiErrorPayload = {
    ok: false,
    error:
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? fallbackMessage)
        : fallbackMessage,
  };

  return NextResponse.json(payload, { status: 500 });
}
