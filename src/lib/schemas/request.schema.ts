import { z } from "zod";
import { ALLOWED_URL_SCHEMES, MAX_URL_LENGTH } from "@/lib/constants";

/**
 * Schema validating an incoming audit request payload.
 *
 * Rules:
 * - `url` must be a syntactically valid URL (Zod v4 top-level `z.url()`).
 * - URL scheme is restricted to http/https via refinement.
 * - URL length is capped to prevent abuse.
 * - Optional `options` object for future extensibility (e.g., depth, format).
 */
const urlSchema = z
  .string()
  .max(MAX_URL_LENGTH, {
    error: `URL must not exceed ${MAX_URL_LENGTH} characters`,
  })
  .refine(
    (val) => {
      try {
        return z.url().safeParse(val).success;
      } catch {
        return false;
      }
    },
    { error: "Value must be a valid URL" },
  )
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return (ALLOWED_URL_SCHEMES as readonly string[]).includes(
          parsed.protocol,
        );
      } catch {
        return false;
      }
    },
    {
      error: `URL scheme must be one of: ${ALLOWED_URL_SCHEMES.join(", ")}`,
    },
  );

export const AuditRequestSchema = z.object({
  url: urlSchema,
  options: z
    .object({
      /** If true, include the raw scraped markdown in the response for debugging. */
      includeRawMarkdown: z.boolean().optional().default(false),
    })
    .optional()
    .default({ includeRawMarkdown: false }),
});

export type AuditRequest = z.infer<typeof AuditRequestSchema>;
