import { generateObject, type LanguageModel } from "ai";
import {
  AiOutputSchema,
  type AuditReport,
  ErrorCode,
  createApiError,
} from "@/lib/schemas";
import type { ScrapeResult } from "./scraper.service";

const SYSTEM_PROMPT = `You are an elite UX/UI copywriter and clarity auditor.
Your job is to analyze the extracted markdown text from a webpage and produce a highly structured, strict JSON report assessing its clarity, readability, and jargon usage.

Rules:
1. Provide a realistic clarity score (0-100). 100 means perfectly clear to a general audience.
2. Identify the most accurate readability level.
3. Find complex corporate jargon and provide plain-English alternatives.
4. Break down the text into logical sections (e.g., "Hero", "Features", "Footer") based on context.
5. Provide specific, actionable side-by-side text rewrite suggestions for sections and globally.
6. Ignore irrelevant boilerplate like raw navigation links or footer copyright text in your analysis.
7. Be strict. Very few pages should score above 90.`;

export class AuditService {
  constructor(private readonly model: LanguageModel) {}

  /**
   * Analyzes scraped website content using an LLM to produce a structured clarity report.
   *
   * @param scrapeResult - The cleaned markdown and metadata from the ScraperService.
   * @returns A fully populated AuditReport including runtime metadata.
   * @throws ApiError with AI_GENERATION_FAILED code on failure.
   */
  async analyze(scrapeResult: ScrapeResult): Promise<AuditReport> {
    try {
      const { object } = await generateObject({
        model: this.model,
        schema: AiOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: `Target URL: ${scrapeResult.sourceUrl}
Page Title: ${scrapeResult.title || "Unknown"}
Page Description: ${scrapeResult.description || "Unknown"}
Text Truncated: ${scrapeResult.wasTruncated ? "Yes (only analyzing beginning)" : "No"}

--- SCRAPED MARKDOWN ---
${scrapeResult.markdown}
-----------------------`,
      });

      const report: AuditReport = {
        targetUrl: scrapeResult.sourceUrl,
        auditedAt: new Date().toISOString(),
        ...object,
      };

      return report;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown AI generation error";
      throw createApiError(
        ErrorCode.AI_GENERATION_FAILED,
        `Failed to generate audit report: ${message}`,
      );
    }
  }
}
