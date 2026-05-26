import type { FindingRecord } from "../schemas/index.js";
import type {
  FindingConfidence,
  FindingSeverity,
  FindingStatus,
} from "../schemas/enums.js";

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CONFIDENCE_RANK: Record<FindingConfidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const STATUS_RANK: Record<FindingStatus, number> = {
  open: 0,
  uncertain: 1,
  "false-positive": 2,
  "wont-fix": 3,
  fixed: 4,
};

export function compareFindings(a: FindingRecord, b: FindingRecord): number {
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (bySeverity !== 0) return bySeverity;
  const byConfidence = CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence];
  if (byConfidence !== 0) return byConfidence;
  const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (byStatus !== 0) return byStatus;
  return a.createdAt.localeCompare(b.createdAt);
}

export function sortFindings(findings: FindingRecord[]): FindingRecord[] {
  return [...findings].sort(compareFindings);
}
