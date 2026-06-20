/**
 * Shared constants used across schema validation and service layers.
 * Centralised here to prevent magic numbers scattered through the codebase.
 */

/** Minimum valid score value (inclusive). */
export const SCORE_MIN = 0;

/** Maximum valid score value (inclusive). */
export const SCORE_MAX = 100;

/** Maximum character length for scraped markdown text before truncation. */
export const MAX_SCRAPED_TEXT_LENGTH = 50_000;

/** Maximum character length for a single suggestion string. */
export const MAX_SUGGESTION_LENGTH = 2_000;

/** Allowed URL schemes for incoming audit requests. */
export const ALLOWED_URL_SCHEMES = ["http:", "https:"] as const;

/** Maximum URL length to prevent abuse via absurdly long URIs. */
export const MAX_URL_LENGTH = 2_048;

/** Standard readability level classifications. */
export const READABILITY_LEVELS = [
  "elementary",
  "middle_school",
  "high_school",
  "college",
  "graduate",
  "expert",
] as const;

export type ReadabilityLevel = (typeof READABILITY_LEVELS)[number];
