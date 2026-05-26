import type { FindingRecord } from "../schemas/index.js";
import type {
  FindingCategory,
  FindingSeverity,
  FindingStatus,
  FindingTriage,
} from "../schemas/enums.js";

export type FindingFilters = {
  statuses?: FindingStatus[];
  severities?: FindingSeverity[];
  categories?: FindingCategory[];
  triages?: FindingTriage[];
  featureId?: string;
  includeFixed?: boolean;
};

export function filterFindings(
  findings: FindingRecord[],
  filters: FindingFilters,
): FindingRecord[] {
  return findings.filter((finding) => {
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(finding.status)) {
        return false;
      }
    } else if (filters.includeFixed !== true && finding.status === "fixed") {
      return false;
    }
    if (filters.severities && filters.severities.length > 0) {
      if (!filters.severities.includes(finding.severity)) {
        return false;
      }
    }
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(finding.category)) {
        return false;
      }
    }
    if (filters.triages && filters.triages.length > 0) {
      if (!filters.triages.includes(finding.triage)) {
        return false;
      }
    }
    if (filters.featureId && finding.featureId !== filters.featureId) {
      return false;
    }
    return true;
  });
}
