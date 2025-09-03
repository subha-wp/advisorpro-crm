import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error]", error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: "Validation failed",
      details: error.issues.map(issue => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    }, { status: 400 })
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json({
          error: "A record with this information already exists",
          field: error.meta?.target
        }, { status: 409 })
      
      case "P2025":
        return NextResponse.json({
          error: "Record not found"
        }, { status: 404 })
      
      case "P2003":
        return NextResponse.json({
          error: "Invalid reference to related record"
        }, { status: 400 })
      
      default:
        return NextResponse.json({
          error: "Database error occurred"
        }, { status: 500 })
    }
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json({
      error: error.message,
      code: error.code
    }, { status: error.statusCode })
  }

  // Generic errors
  if (error instanceof Error) {
    return NextResponse.json({
      error: process.env.NODE_ENV === "development" 
        ? error.message 
        : "An unexpected error occurred"
    }, { status: 500 })
  }

  // Unknown errors
  return NextResponse.json({
    error: "An unexpected error occurred"
  }, { status: 500 })
}

export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}