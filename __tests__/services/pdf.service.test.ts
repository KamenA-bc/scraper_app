import { describe, it, expect, vi, beforeEach } from "vitest";
import { PdfService } from "@/lib/services/pdf.service";
import { ErrorCode, type AuditReport } from "@/lib/schemas";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

// Mock puppeteer
vi.mock("puppeteer-core", () => {
  const mockPage = {
    setContent: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  };
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };
  return {
    default: {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    },
  };
});

vi.mock("@sparticuz/chromium-min", () => {
  return {
    default: {
      args: ["--mock"],
      executablePath: vi.fn().mockResolvedValue("/mock/path"),
      headless: true,
    }
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────

const MOCK_REPORT: AuditReport = {
  targetUrl: "https://example.com?foo=bar&baz=1",
  auditedAt: "2025-01-15T12:00:00.000Z",
  overallClarityScore: 85,
  overallReadabilityLevel: "high_school",
  summary: "A brief test summary.",
  jargon: [
    { term: "Synergy", definition: "Working together", occurrences: 2 },
  ],
  sections: [
    {
      sectionName: "Hero <script>alert(1)</script>", // Testing XSS
      clarityScore: 90,
      readabilityLevel: "middle_school",
      issues: ["Issue 1"],
      suggestions: [
        {
          original: "Old",
          improved: "New",
          reason: "Better",
        },
      ],
    },
  ],
  globalSuggestions: [],
};

// ─── Tests ────────────────────────────────────────────────────────────

describe("PdfService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a PDF successfully and calls browser.close()", async () => {
    const service = new PdfService();
    const result = await service.generatePdf(MOCK_REPORT);

    // Should return a Buffer
    expect(Buffer.isBuffer(result)).toBe(true);

    // Verify puppeteer lifecycle
    expect(puppeteer.launch).toHaveBeenCalledTimes(1);
    const mockBrowser = await vi.mocked(puppeteer.launch).mock.results[0].value;
    expect(mockBrowser.newPage).toHaveBeenCalledTimes(1);
    
    const mockPage = await mockBrowser.newPage.mock.results[0].value;
    expect(mockPage.setContent).toHaveBeenCalledTimes(1);
    expect(mockPage.pdf).toHaveBeenCalledTimes(1);
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });

  it("escapes HTML in the generated HTML to prevent XSS and formatting issues", async () => {
    const service = new PdfService();
    await service.generatePdf(MOCK_REPORT);

    const mockBrowser = await vi.mocked(puppeteer.launch).mock.results[0].value;
    const mockPage = await mockBrowser.newPage.mock.results[0].value;
    
    // Check the HTML passed to setContent
    const htmlContent = mockPage.setContent.mock.calls[0][0];
    
    // The script tag should be escaped
    expect(htmlContent).not.toContain("<script>alert(1)</script>");
    expect(htmlContent).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    
    // The URL should have its ampersand escaped
    expect(htmlContent).not.toContain("https://example.com?foo=bar&baz=1");
    expect(htmlContent).toContain("https://example.com?foo=bar&amp;baz=1");
  });

  it("throws PDF_GENERATION_FAILED if puppeteer fails to launch", async () => {
    vi.mocked(puppeteer.launch).mockRejectedValueOnce(
      new Error("Failed to launch browser")
    );

    const service = new PdfService();

    await expect(service.generatePdf(MOCK_REPORT)).rejects.toMatchObject({
      code: ErrorCode.PDF_GENERATION_FAILED,
      message: expect.stringContaining("Failed to launch browser"),
    });
  });

  it("closes the browser even if page.pdf throws", async () => {
    // Setup a failure at the page.pdf step
    const mockPage = {
      setContent: vi.fn().mockResolvedValue(undefined),
      pdf: vi.fn().mockRejectedValue(new Error("PDF generation failed")),
    };
    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(puppeteer.launch).mockResolvedValueOnce(mockBrowser as any);

    const service = new PdfService();

    await expect(service.generatePdf(MOCK_REPORT)).rejects.toMatchObject({
      code: ErrorCode.PDF_GENERATION_FAILED,
    });

    // Browser should still be closed!
    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });
});
