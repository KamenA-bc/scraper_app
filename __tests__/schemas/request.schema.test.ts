import { describe, it, expect } from "vitest";
import { AuditRequestSchema } from "@/lib/schemas/request.schema";

describe("AuditRequestSchema", () => {
  // ─── Success Cases ──────────────────────────────────────────────

  it("accepts a valid HTTPS URL with default options", () => {
    const result = AuditRequestSchema.safeParse({
      url: "https://example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe("https://example.com");
      expect(result.data.options.includeRawMarkdown).toBe(false);
    }
  });

  it("accepts a valid HTTP URL", () => {
    const result = AuditRequestSchema.safeParse({
      url: "http://example.com/path?q=1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts explicit options", () => {
    const result = AuditRequestSchema.safeParse({
      url: "https://example.com",
      options: { includeRawMarkdown: true },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options.includeRawMarkdown).toBe(true);
    }
  });

  it("accepts a URL with port, path, query, and fragment", () => {
    const result = AuditRequestSchema.safeParse({
      url: "https://example.com:8080/page?key=value#section",
    });
    expect(result.success).toBe(true);
  });

  // ─── Rejection Cases ───────────────────────────────────────────

  it("rejects an empty string", () => {
    const result = AuditRequestSchema.safeParse({ url: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing url field", () => {
    const result = AuditRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a non-string url", () => {
    const result = AuditRequestSchema.safeParse({ url: 12345 });
    expect(result.success).toBe(false);
  });

  it("rejects a file:// scheme URL", () => {
    const result = AuditRequestSchema.safeParse({
      url: "file:///etc/passwd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an ftp:// scheme URL", () => {
    const result = AuditRequestSchema.safeParse({
      url: "ftp://files.example.com/data",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a javascript: scheme URL", () => {
    const result = AuditRequestSchema.safeParse({
      url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a plain string that is not a URL", () => {
    const result = AuditRequestSchema.safeParse({ url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects a URL exceeding the maximum length", () => {
    const longUrl = "https://example.com/" + "a".repeat(2100);
    const result = AuditRequestSchema.safeParse({ url: longUrl });
    expect(result.success).toBe(false);
  });

  it("rejects null payload", () => {
    const result = AuditRequestSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects undefined payload", () => {
    const result = AuditRequestSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});
