import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import {
  AuditRequestSchema,
  createApiError,
  ErrorCode,
  type ApiError,
} from "@/lib/schemas";
import { ScraperService } from "@/lib/services/scraper.service";
import { AuditService } from "@/lib/services/audit.service";

export const maxDuration = 300;

/**
 * Type guard for ApiError
 */
function isApiError(obj: unknown): obj is ApiError {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "code" in obj &&
    "message" in obj &&
    "timestamp" in obj
  );
}

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the incoming JSON request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createApiError(ErrorCode.VALIDATION_ERROR, "Invalid JSON payload"),
        { status: 400 },
      );
    }

    const parseResult = AuditRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        createApiError(
          ErrorCode.VALIDATION_ERROR,
          "Request validation failed",
          parseResult.error.format(),
        ),
        { status: 400 },
      );
    }

    const { url, options } = parseResult.data;

    // 2. Perform the scrape
    const scraper = new ScraperService();
    const scrapeResult = await scraper.scrape(url);

    // 3. Perform the AI analysis
    // You can swap the provider/model here (e.g., anthropic('claude-3-5-sonnet-latest'))
    const model = google("gemini-2.5-flash");
    const auditor = new AuditService(model);
    const auditReport = await auditor.analyze(scrapeResult);

    // 4. Construct the final response
    return NextResponse.json({
      success: true,
      data: auditReport,
      // Conditionally include raw markdown if requested for debugging
      ...(options?.includeRawMarkdown ? { rawScrape: scrapeResult } : {}),
    });
  } catch (error: unknown) {
    // Handle expected API errors
    if (isApiError(error)) {
      // Map domain error codes to HTTP status codes
      let status = 500;
      if (error.code === ErrorCode.VALIDATION_ERROR) status = 400;
      else if (error.code === ErrorCode.RATE_LIMITED) status = 429;
      else if (error.code === ErrorCode.SCRAPE_TIMEOUT) status = 504;

      return NextResponse.json(error, { status });
    }

    // Handle unexpected errors
    console.error("[API_AUDIT_ERROR] Unexpected failure:", error);
    return NextResponse.json(
      createApiError(ErrorCode.INTERNAL_ERROR, "An unexpected internal error occurred"),
      { status: 500 },
    );
  }
}
