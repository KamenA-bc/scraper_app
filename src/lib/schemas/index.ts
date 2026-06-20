/**
 * Barrel re-exports for all schema modules.
 * Import from "@/lib/schemas" for ergonomic access.
 */
export {
  AuditRequestSchema,
  type AuditRequest,
} from "./request.schema";

export {
  AuditReportSchema,
  AiOutputSchema,
  type AuditReport,
  type AiOutput,
  type JargonEntry,
  type TextSuggestion,
  type SectionAnalysis,
} from "./audit-report.schema";

export {
  ApiErrorSchema,
  ErrorCode,
  createApiError,
  type ApiError,
  type ErrorCodeValue,
} from "./error.schema";
