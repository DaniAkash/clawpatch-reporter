import type {
  FindingCategory,
  FindingSeverity,
  FindingStatus,
  FindingTriage,
} from "../../schemas/enums.js";

export const SEVERITY_ORDER: FindingSeverity[] = ["critical", "high", "medium", "low"];
export const STATUS_ORDER: FindingStatus[] = [
  "open",
  "uncertain",
  "false-positive",
  "wont-fix",
  "fixed",
];
export const CATEGORY_ORDER: FindingCategory[] = [
  "security",
  "data-loss",
  "concurrency",
  "bug",
  "api-contract",
  "performance",
  "test-gap",
  "docs-gap",
  "build-release",
  "maintainability",
];

export function severityIcon(severity: FindingSeverity): string {
  switch (severity) {
    case "critical":
      return "🚨";
    case "high":
      return "🔴";
    case "medium":
      return "🟠";
    case "low":
      return "🟡";
  }
}

export function statusGlyph(status: FindingStatus): string {
  switch (status) {
    case "open":
      return "◯";
    case "uncertain":
      return "?";
    case "false-positive":
      return "✗";
    case "wont-fix":
      return "⊘";
    case "fixed":
      return "✓";
  }
}

export function triageLabel(triage: FindingTriage): string {
  return triage;
}
