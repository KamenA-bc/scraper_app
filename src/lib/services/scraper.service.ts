import { Firecrawl } from "@mendable/firecrawl-js";
import { MAX_SCRAPED_TEXT_LENGTH } from "@/lib/constants";
import { createApiError, ErrorCode, type ApiError } from "@/lib/schemas";

// ─── Types ───────────────────────────────────────────────────────────

/** The cleaned result returned by the scraper service. */
export interface ScrapeResult {
  /** The cleaned markdown text extracted from the page. */
  markdown: string;
  /** The page title from metadata, if available. */
  title: string | undefined;
  /** The page description from metadata, if available. */
  description: string | undefined;
  /** The source URL that was scraped. */
  sourceUrl: string;
  /** Whether the markdown was truncated to fit the token window. */
  wasTruncated: boolean;
  /** Original character count before truncation. */
  originalLength: number;
}

/**
 * Interface for the scraper dependency.
 * This abstraction allows us to:
 * 1. Mock the Firecrawl client in tests.
 * 2. Swap in alternative scrapers (e.g., Puppeteer fallback) in the future.
 */
export interface ScrapeClient {
  scrape(
    url: string,
    options?: { formats?: string[] },
  ): Promise<{
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      statusCode?: number;
      error?: string;
    };
  }>;
}

// ─── Error Helpers ───────────────────────────────────────────────────

/** Type guard: is this value an Error-like object with a `message` property? */
function isErrorLike(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as Record<string, unknown>).message === "string"
  );
}

/** Extract a human-readable error message from an unknown caught value. */
function extractErrorMessage(error: unknown): string {
  if (isErrorLike(error)) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred during scraping";
}

/**
 * Classify an error into the appropriate error code.
 * Inspects the error message for known patterns.
 */
function classifyError(error: unknown): ApiError {
  const message = extractErrorMessage(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
    return createApiError(
      ErrorCode.SCRAPE_TIMEOUT,
      `Scraping timed out: ${message}`,
    );
  }

  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("429") ||
    lowerMessage.includes("too many requests")
  ) {
    return createApiError(
      ErrorCode.RATE_LIMITED,
      `Rate limited by scraping service: ${message}`,
    );
  }

  return createApiError(ErrorCode.SCRAPE_FAILED, `Scraping failed: ${message}`);
}

// ─── Service ─────────────────────────────────────────────────────────

export class ScraperService {
  private readonly client: ScrapeClient;

  constructor(client?: ScrapeClient) {
    if (client) {
      this.client = client;
    } else {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        throw new Error(
          "FIRECRAWL_API_KEY environment variable is required. " +
            "Get one at https://firecrawl.dev",
        );
      }
      this.client = new Firecrawl({ apiKey });
    }
  }

  /**
   * Scrape a URL and return cleaned markdown text.
   *
   * @param url - The validated URL to scrape.
   * @returns A ScrapeResult with cleaned markdown and metadata.
   * @throws An object conforming to ApiError on failure.
   */
  async scrape(url: string): Promise<ScrapeResult> {
    let response: Awaited<ReturnType<ScrapeClient["scrape"]>>;

    try {
      response = await this.client.scrape(url, {
        formats: ["markdown"],
      });
    } catch (error: unknown) {
      throw classifyError(error);
    }

    // ── Validate response has usable content ───────────────────────
    const markdown = response.markdown;

    if (!markdown || markdown.trim().length === 0) {
      const statusCode = response.metadata?.statusCode;
      const serverError = response.metadata?.error;

      let detail = "The scraper returned no readable text content.";
      if (statusCode && statusCode >= 400) {
        detail += ` The target URL responded with HTTP ${statusCode}.`;
      }
      if (serverError) {
        detail += ` Server error: ${serverError}`;
      }

      throw createApiError(ErrorCode.SCRAPE_FAILED, detail);
    }

    // ── Clean and truncate ─────────────────────────────────────────
    const cleaned = this.cleanMarkdown(markdown);
    const originalLength = cleaned.length;
    const wasTruncated = originalLength > MAX_SCRAPED_TEXT_LENGTH;
    const finalMarkdown = wasTruncated
      ? cleaned.slice(0, MAX_SCRAPED_TEXT_LENGTH)
      : cleaned;

    return {
      markdown: finalMarkdown,
      title: response.metadata?.title,
      description: response.metadata?.description,
      sourceUrl: url,
      wasTruncated,
      originalLength,
    };
  }

  /**
   * Clean raw markdown by removing excessive whitespace,
   * navigation/footer boilerplate markers, and normalising line endings.
   */
  private cleanMarkdown(raw: string): string {
    return (
      raw
        // Normalise line endings
        .replace(/\r\n/g, "\n")
        // Collapse runs of 3+ newlines into 2
        .replace(/\n{3,}/g, "\n\n")
        // Remove common boilerplate link-list patterns
        // (e.g., "[Home](/home) [About](/about) [Contact](/contact)")
        .replace(/^(\[[\w\s]+\]\([^)]+\)\s*){3,}$/gm, "")
        // Trim leading/trailing whitespace
        .trim()
    );
  }
}
