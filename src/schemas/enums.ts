import { z } from "zod";

export const findingCategories = [
  "bug",
  "security",
  "performance",
  "concurrency",
  "api-contract",
  "data-loss",
  "test-gap",
  "docs-gap",
  "build-release",
  "maintainability",
] as const;

export const findingTriages = [
  "confirmed-bug",
  "contract-mismatch",
  "risk",
  "test-gap",
  "docs-gap",
] as const;

export const findingSeverities = ["critical", "high", "medium", "low"] as const;
export const findingConfidences = ["high", "medium", "low"] as const;
export const findingStatuses = ["open", "false-positive", "fixed", "wont-fix", "uncertain"] as const;

export const featureKinds = [
  "cli-command",
  "route",
  "ui-flow",
  "service",
  "job",
  "agent-tool",
  "library",
  "config",
  "release",
  "test-suite",
  "infra",
  "unknown",
] as const;

export const featureStatuses = [
  "pending",
  "claimed",
  "reviewed",
  "needs-fix",
  "fixing",
  "fixed",
  "revalidated",
  "skipped",
  "error",
] as const;

export const trustBoundaries = [
  "user-input",
  "network",
  "filesystem",
  "secrets",
  "process-exec",
  "database",
  "auth",
  "permissions",
  "concurrency",
  "external-api",
  "serialization",
] as const;

export const patchAttemptStatuses = [
  "planned",
  "applying",
  "applied",
  "validated",
  "failed",
  "abandoned",
] as const;

export const runStatuses = ["running", "completed", "failed", "cancelled"] as const;

export const reasoningEfforts = ["none", "minimal", "low", "medium", "high", "xhigh"] as const;

export const reasoningEffortSchema = z.enum(reasoningEfforts);
export type ReasoningEffort = z.infer<typeof reasoningEffortSchema>;

export type FindingCategory = (typeof findingCategories)[number];
export type FindingTriage = (typeof findingTriages)[number];
export type FindingSeverity = (typeof findingSeverities)[number];
export type FindingConfidence = (typeof findingConfidences)[number];
export type FindingStatus = (typeof findingStatuses)[number];
export type FeatureKind = (typeof featureKinds)[number];
export type FeatureStatus = (typeof featureStatuses)[number];
export type TrustBoundary = (typeof trustBoundaries)[number];
export type PatchAttemptStatus = (typeof patchAttemptStatuses)[number];
export type RunStatus = (typeof runStatuses)[number];

export function deriveFindingTriage(
  category: FindingCategory,
  confidence: FindingConfidence,
): FindingTriage {
  if (category === "test-gap") {
    return "test-gap";
  }
  if (category === "docs-gap") {
    return "docs-gap";
  }
  if (category === "api-contract") {
    return "contract-mismatch";
  }
  if (
    confidence === "high" &&
    (category === "bug" ||
      category === "security" ||
      category === "data-loss" ||
      category === "concurrency")
  ) {
    return "confirmed-bug";
  }
  return "risk";
}
