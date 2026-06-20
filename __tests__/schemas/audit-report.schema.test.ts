import { describe, it, expect } from "vitest";
import {
  AuditReportSchema,
  AiOutputSchema,
} from "@/lib/schemas/audit-report.schema";

/** A fully valid AuditReport fixture. */
function validReport() {
  return {
    targetUrl: "https://example.com",
    auditedAt: new Date().toISOString(),
    overallClarityScore: 72,
    overallReadabilityLevel: "high_school" as const,
    summary: "The page has moderate clarity with some jargon issues.",
    jargon: [
      {
        term: "synergy",
        definition: "Combined effort producing greater results",
        occurrences: 3,
      },
    ],
    sections: [
      {
        sectionName: "Hero Section",
        clarityScore: 80,
        readabilityLevel: "middle_school" as const,
        issues: ["Vague call-to-action text"],
        suggestions: [
          {
            original: "Leverage our synergies",
            improved: "Work together for better results",
            reason: "Removes corporate jargon for broader audience comprehension",
          },
        ],
      },
    ],
    globalSuggestions: [
      {
        original: "Utilize our platform",
        improved: "Use our platform",
        reason: "'Utilize' is unnecessarily complex when 'use' conveys the same meaning",
      },
    ],
  };
}

describe("AuditReportSchema", () => {
  // ─── Success Cases ──────────────────────────────────────────────

  it("accepts a fully valid audit report", () => {
    const result = AuditReportSchema.safeParse(validReport());
    expect(result.success).toBe(true);
  });

  it("accepts all readability levels", () => {
    const levels = [
      "elementary",
      "middle_school",
      "high_school",
      "college",
      "graduate",
      "expert",
    ] as const;
    for (const level of levels) {
      const report = { ...validReport(), overallReadabilityLevel: level };
      const result = AuditReportSchema.safeParse(report);
      expect(result.success).toBe(true);
    }
  });

  it("accepts an empty jargon array", () => {
    const report = { ...validReport(), jargon: [] };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  it("accepts an empty globalSuggestions array", () => {
    const report = { ...validReport(), globalSuggestions: [] };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  it("accepts multiple sections", () => {
    const report = validReport();
    report.sections.push({
      sectionName: "Footer",
      clarityScore: 90,
      readabilityLevel: "elementary",
      issues: [],
      suggestions: [],
    });
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  // ─── Boundary Score Validation ──────────────────────────────────

  it("accepts score of exactly 0", () => {
    const report = { ...validReport(), overallClarityScore: 0 };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  it("accepts score of exactly 100", () => {
    const report = { ...validReport(), overallClarityScore: 100 };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(true);
  });

  it("rejects a score of -1", () => {
    const report = { ...validReport(), overallClarityScore: -1 };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it("rejects a score of 101", () => {
    const report = { ...validReport(), overallClarityScore: 101 };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it("rejects a fractional score", () => {
    const report = { ...validReport(), overallClarityScore: 72.5 };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  // ─── Rejection Cases ───────────────────────────────────────────

  it("rejects an invalid readability level", () => {
    const report = {
      ...validReport(),
      overallReadabilityLevel: "doctorate",
    };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it("rejects an empty sections array (min 1 required)", () => {
    const report = { ...validReport(), sections: [] };
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it("rejects a missing targetUrl", () => {
    const { targetUrl: _, ...partial } = validReport();
    const result = AuditReportSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it("rejects a missing summary", () => {
    const { summary: _, ...partial } = validReport();
    const result = AuditReportSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it("rejects jargon entry with zero occurrences", () => {
    const report = validReport();
    report.jargon[0].occurrences = 0;
    const result = AuditReportSchema.safeParse(report);
    expect(result.success).toBe(false);
  });

  it("rejects a completely empty object", () => {
    const result = AuditReportSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("AiOutputSchema", () => {
  it("accepts a valid AI output (without targetUrl and auditedAt)", () => {
    const { targetUrl: _, auditedAt: __, ...aiOutput } = validReport();
    const result = AiOutputSchema.safeParse(aiOutput);
    expect(result.success).toBe(true);
  });

  it("still rejects invalid scores in AI output", () => {
    const { targetUrl: _, auditedAt: __, ...aiOutput } = validReport();
    const result = AiOutputSchema.safeParse({
      ...aiOutput,
      overallClarityScore: 150,
    });
    expect(result.success).toBe(false);
  });
});
