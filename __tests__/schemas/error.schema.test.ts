import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ApiErrorSchema,
  ErrorCode,
  createApiError,
} from "@/lib/schemas/error.schema";

describe("ApiErrorSchema", () => {
  it("accepts a well-formed error object", () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "The url field is required.",
      timestamp: new Date().toISOString(),
    };
    const result = ApiErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
  });

  it("accepts an error with details", () => {
    const error = {
      code: "VALIDATION_ERROR",
      message: "Invalid payload",
      details: [{ path: ["url"], message: "Required" }],
      timestamp: new Date().toISOString(),
    };
    const result = ApiErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
  });

  it("rejects an error with empty code", () => {
    const error = {
      code: "",
      message: "Something went wrong",
      timestamp: new Date().toISOString(),
    };
    const result = ApiErrorSchema.safeParse(error);
    expect(result.success).toBe(false);
  });

  it("rejects an error with empty message", () => {
    const error = {
      code: "INTERNAL_ERROR",
      message: "",
      timestamp: new Date().toISOString(),
    };
    const result = ApiErrorSchema.safeParse(error);
    expect(result.success).toBe(false);
  });

  it("rejects a missing timestamp", () => {
    const error = {
      code: "INTERNAL_ERROR",
      message: "Oops",
    };
    const result = ApiErrorSchema.safeParse(error);
    expect(result.success).toBe(false);
  });
});

describe("ErrorCode constants", () => {
  it("contains all expected error codes", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.SCRAPE_FAILED).toBe("SCRAPE_FAILED");
    expect(ErrorCode.SCRAPE_TIMEOUT).toBe("SCRAPE_TIMEOUT");
    expect(ErrorCode.AI_GENERATION_FAILED).toBe("AI_GENERATION_FAILED");
    expect(ErrorCode.PDF_GENERATION_FAILED).toBe("PDF_GENERATION_FAILED");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
  });
});

describe("createApiError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a valid ApiError with a deterministic timestamp", () => {
    const error = createApiError(
      ErrorCode.VALIDATION_ERROR,
      "URL is required",
    );
    expect(error).toEqual({
      code: "VALIDATION_ERROR",
      message: "URL is required",
      details: undefined,
      timestamp: "2025-01-15T12:00:00.000Z",
    });
  });

  it("includes details when provided", () => {
    const details = { field: "url", issue: "missing" };
    const error = createApiError(
      ErrorCode.SCRAPE_FAILED,
      "Could not reach target",
      details,
    );
    expect(error.details).toEqual(details);
  });

  it("produces output that passes ApiErrorSchema validation", () => {
    const error = createApiError(
      ErrorCode.INTERNAL_ERROR,
      "Unexpected failure",
    );
    const result = ApiErrorSchema.safeParse(error);
    expect(result.success).toBe(true);
  });
});
