import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuditService } from "@/lib/services/audit.service";
import type { ScrapeResult } from "@/lib/services/scraper.service";
import { ErrorCode } from "@/lib/schemas";
import type { LanguageModel } from "ai";

// Mock the ai module
vi.mock("ai", () => {
  return {
    generateObject: vi.fn(),
  };
});

import { generateObject } from "ai";

// ─── Fixtures ─────────────────────────────────────────────────────────

const MOCK_SCRAPE_RESULT: ScrapeResult = {
  markdown: "# Test Page\n\nSome content here.",
  title: "Test Page Title",
  description: "Test Description",
  sourceUrl: "https://example.com/test",
  wasTruncated: false,
  originalLength: 50,
};

const MOCK_AI_OUTPUT = {
  overallClarityScore: 85,
  overallReadabilityLevel: "high_school",
  summary: "A brief test summary.",
  jargon: [],
  sections: [
    {
      sectionName: "Hero",
      clarityScore: 90,
      readabilityLevel: "middle_school",
      issues: [],
      suggestions: [],
    },
  ],
  globalSuggestions: [],
};

const dummyModel = {} as LanguageModel;

// ─── Tests ────────────────────────────────────────────────────────────

describe("AuditService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls generateObject with correct prompt and returns an AuditReport", async () => {
    // Setup mock resolution
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: MOCK_AI_OUTPUT,
    } as any);

    const service = new AuditService(dummyModel);
    const result = await service.analyze(MOCK_SCRAPE_RESULT);

    // Verify generateObject was called correctly
    expect(generateObject).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(generateObject).mock.calls[0][0];
    expect(callArgs.model).toBe(dummyModel);
    expect(callArgs.prompt).toContain("Target URL: https://example.com/test");
    expect(callArgs.prompt).toContain("Page Title: Test Page Title");
    expect(callArgs.prompt).toContain("Text Truncated: No");
    expect(callArgs.prompt).toContain("# Test Page");

    // Verify result includes injected metadata
    expect(result.targetUrl).toBe("https://example.com/test");
    expect(result.auditedAt).toBe("2025-01-15T12:00:00.000Z");
    expect(result.overallClarityScore).toBe(85);
  });

  it("throws AI_GENERATION_FAILED when generateObject throws an Error", async () => {
    vi.mocked(generateObject).mockRejectedValueOnce(
      new Error("Context length exceeded"),
    );

    const service = new AuditService(dummyModel);

    await expect(service.analyze(MOCK_SCRAPE_RESULT)).rejects.toMatchObject({
      code: ErrorCode.AI_GENERATION_FAILED,
      message: expect.stringContaining("Context length exceeded"),
    });
  });

  it("throws AI_GENERATION_FAILED when generateObject throws a string", async () => {
    vi.mocked(generateObject).mockRejectedValueOnce("String error");

    const service = new AuditService(dummyModel);

    await expect(service.analyze(MOCK_SCRAPE_RESULT)).rejects.toMatchObject({
      code: ErrorCode.AI_GENERATION_FAILED,
      message: expect.stringContaining("Unknown AI generation error"),
    });
  });

  it("indicates truncation in the prompt if wasTruncated is true", async () => {
    vi.mocked(generateObject).mockResolvedValueOnce({
      object: MOCK_AI_OUTPUT,
    } as any);

    const truncatedResult = { ...MOCK_SCRAPE_RESULT, wasTruncated: true };
    const service = new AuditService(dummyModel);
    await service.analyze(truncatedResult);

    const callArgs = vi.mocked(generateObject).mock.calls[0][0];
    expect(callArgs.prompt).toContain("Text Truncated: Yes");
  });
});
