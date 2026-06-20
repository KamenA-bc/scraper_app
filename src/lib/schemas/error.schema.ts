import { z } from "zod";

/**
 * Standardised API error envelope.
 * Every error response from any route in this application
 * conforms to this shape for predictable client-side handling.
 */
export const ApiErrorSchema = z.object({
  /** Machine-readable error code (e.g., "VALIDATION_ERROR", "SCRAPE_FAILED"). */
  code: z.string().min(1),

  /** Human-readable error message suitable for display. */
  message: z.string().min(1),

  /** Optional structured details (e.g., Zod validation issue paths). */
  details: z.unknown().optional(),

  /** ISO 8601 timestamp of when the error occurred. */
  timestamp: z.string().min(1),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Known error codes used throughout the application.
 * Centralised here to prevent string typos in route handlers.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SCRAPE_FAILED: "SCRAPE_FAILED",
  SCRAPE_TIMEOUT: "SCRAPE_TIMEOUT",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  PDF_GENERATION_FAILED: "PDF_GENERATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Factory function to create a well-formed ApiError object.
 * Ensures timestamp is always present and shape is always valid.
 */
export function createApiError(
  code: ErrorCodeValue,
  message: string,
  details?: unknown,
): ApiError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
}
