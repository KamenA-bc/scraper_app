import { describe, it, expect, vi } from "vitest";
import {
  ScraperService,
  type ScrapeClient,
} from "@/lib/services/scraper.service";
import { ErrorCode } from "@/lib/schemas";
import { MAX_SCRAPED_TEXT_LENGTH } from "@/lib/constants";

// ─── Mock Helpers ─────────────────────────────────────────────────────

/** Create a mock ScrapeClient that resolves with the given data. */
function createMockClient(
  response: Awaited<ReturnType<ScrapeClient["scrape"]>>,
): ScrapeClient {
  return {
    scrape: vi.fn().mockResolvedValue(response),
  };
}

/** Create a mock ScrapeClient that rejects with the given error. */
function createFailingClient(error: unknown): ScrapeClient {
  return {
    scrape: vi.fn().mockRejectedValue(error),
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────

const VALID_RESPONSE = {
  markdown:
    "# Welcome to Example\n\nThis is a well-structured page with clear content.\n\nLearn more about our services below.",
  metadata: {
    title: "Example Page",
    description: "An example page for testing",
    statusCode: 200,
  },
};

const EMPTY_MARKDOWN_RESPONSE = {
  markdown: "",
  metadata: {
    title: "Empty Page",
    statusCode: 200,
  },
};

const WHITESPACE_ONLY_RESPONSE = {
  markdown: "   \n\n\t  \n  ",
  metadata: {
    title: "Whitespace Page",
    statusCode: 200,
  },
};

const HTTP_404_RESPONSE = {
  markdown: "",
  metadata: {
    title: undefined,
    statusCode: 404,
    error: "Page not found",
  },
};

const HTTP_500_RESPONSE = {
  markdown: undefined,
  metadata: {
    title: undefined,
    statusCode: 500,
    error: "Internal server error",
  },
};

// ─── Tests ────────────────────────────────────────────────────────────

describe("ScraperService", () => {
  // ── Constructor ─────────────────────────────────────────────────

  describe("constructor", () => {
    it("accepts a custom ScrapeClient", () => {
      const client = createMockClient(VALID_RESPONSE);
      const service = new ScraperService(client);
      expect(service).toBeInstanceOf(ScraperService);
    });

    it("throws if no client provided and FIRECRAWL_API_KEY is missing", () => {
      const original = process.env.FIRECRAWL_API_KEY;
      delete process.env.FIRECRAWL_API_KEY;

      expect(() => new ScraperService()).toThrow("FIRECRAWL_API_KEY");

      // Restore
      if (original !== undefined) {
        process.env.FIRECRAWL_API_KEY = original;
      }
    });
  });

  // ── Successful Scraping ─────────────────────────────────────────

  describe("successful scraping", () => {
    it("returns cleaned markdown and metadata for a valid page", async () => {
      const client = createMockClient(VALID_RESPONSE);
      const service = new ScraperService(client);

      const result = await service.scrape("https://example.com");

      expect(result.markdown).toContain("Welcome to Example");
      expect(result.title).toBe("Example Page");
      expect(result.description).toBe("An example page for testing");
      expect(result.sourceUrl).toBe("https://example.com");
      expect(result.wasTruncated).toBe(false);
    });

    it("calls the client with the correct URL and markdown format", async () => {
      const client = createMockClient(VALID_RESPONSE);
      const service = new ScraperService(client);

      await service.scrape("https://example.com");

      expect(client.scrape).toHaveBeenCalledWith("https://example.com", {
        formats: ["markdown"],
      });
    });

    it("collapses excessive newlines in markdown", async () => {
      const client = createMockClient({
        markdown: "# Title\n\n\n\n\n\nParagraph one.\n\n\n\nParagraph two.",
        metadata: { statusCode: 200 },
      });
      const service = new ScraperService(client);

      const result = await service.scrape("https://example.com");

      expect(result.markdown).toBe(
        "# Title\n\nParagraph one.\n\nParagraph two.",
      );
    });

    it("normalises CRLF line endings", async () => {
      const client = createMockClient({
        markdown: "Line one\r\nLine two\r\nLine three",
        metadata: { statusCode: 200 },
      });
      const service = new ScraperService(client);

      const result = await service.scrape("https://example.com");

      expect(result.markdown).not.toContain("\r");
      expect(result.markdown).toBe("Line one\nLine two\nLine three");
    });
  });

  // ── Truncation ──────────────────────────────────────────────────

  describe("truncation", () => {
    it("truncates markdown exceeding MAX_SCRAPED_TEXT_LENGTH", async () => {
      const oversizedMarkdown = "A".repeat(MAX_SCRAPED_TEXT_LENGTH + 5000);
      const client = createMockClient({
        markdown: oversizedMarkdown,
        metadata: { statusCode: 200 },
      });
      const service = new ScraperService(client);

      const result = await service.scrape("https://example.com");

      expect(result.markdown.length).toBe(MAX_SCRAPED_TEXT_LENGTH);
      expect(result.wasTruncated).toBe(true);
      expect(result.originalLength).toBe(MAX_SCRAPED_TEXT_LENGTH + 5000);
    });

    it("does not truncate markdown within limits", async () => {
      const normalMarkdown = "B".repeat(1000);
      const client = createMockClient({
        markdown: normalMarkdown,
        metadata: { statusCode: 200 },
      });
      const service = new ScraperService(client);

      const result = await service.scrape("https://example.com");

      expect(result.markdown.length).toBe(1000);
      expect(result.wasTruncated).toBe(false);
      expect(result.originalLength).toBe(1000);
    });
  });

  // ── Empty / Missing Content ─────────────────────────────────────

  describe("empty content handling", () => {
    it("throws SCRAPE_FAILED for empty markdown", async () => {
      const client = createMockClient(EMPTY_MARKDOWN_RESPONSE);
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
          message: expect.stringContaining("no readable text"),
        },
      );
    });

    it("throws SCRAPE_FAILED for whitespace-only markdown", async () => {
      const client = createMockClient(WHITESPACE_ONLY_RESPONSE);
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
        },
      );
    });

    it("includes HTTP status code in error for 404 responses", async () => {
      const client = createMockClient(HTTP_404_RESPONSE);
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
          message: expect.stringContaining("404"),
        },
      );
    });

    it("includes HTTP status code in error for 500 responses", async () => {
      const client = createMockClient(HTTP_500_RESPONSE);
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
          message: expect.stringContaining("500"),
        },
      );
    });
  });

  // ── Network / SDK Errors ────────────────────────────────────────

  describe("error classification", () => {
    it("classifies timeout errors as SCRAPE_TIMEOUT", async () => {
      const client = createFailingClient(
        new Error("Request timed out after 30000ms"),
      );
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_TIMEOUT,
          message: expect.stringContaining("timed out"),
        },
      );
    });

    it("classifies rate limit errors as RATE_LIMITED", async () => {
      const client = createFailingClient(
        new Error("429 Too Many Requests - Rate limit exceeded"),
      );
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.RATE_LIMITED,
          message: expect.stringContaining("Rate limited"),
        },
      );
    });

    it("classifies generic errors as SCRAPE_FAILED", async () => {
      const client = createFailingClient(
        new Error("Network connection refused"),
      );
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
          message: expect.stringContaining("Network connection refused"),
        },
      );
    });

    it("handles non-Error thrown values gracefully", async () => {
      const client = createFailingClient("raw string error");
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
          message: expect.stringContaining("raw string error"),
        },
      );
    });

    it("handles thrown null/undefined gracefully", async () => {
      const client = createFailingClient(null);
      const service = new ScraperService(client);

      await expect(service.scrape("https://example.com")).rejects.toMatchObject(
        {
          code: ErrorCode.SCRAPE_FAILED,
          message: expect.stringContaining("unknown error"),
        },
      );
    });
  });
});
