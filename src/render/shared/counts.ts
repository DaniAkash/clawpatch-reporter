import type { FindingRecord } from "../../schemas/index.js";
import type {
  FindingCategory,
  FindingSeverity,
  FindingStatus,
} from "../../schemas/enums.js";
import { CATEGORY_ORDER, SEVERITY_ORDER, STATUS_ORDER } from "./labels.js";

export type FindingCounts = {
  severity: Record<FindingSeverity, number>;
  status: Record<FindingStatus, number>;
  category: Record<FindingCategory, number>;
};

export function tallyFindings(findings: FindingRecord[]): FindingCounts {
  const severity = SEVERITY_ORDER.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<FindingSeverity, number>,
  );
  const status = STATUS_ORDER.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<FindingStatus, number>,
  );
  const category = CATEGORY_ORDER.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<FindingCategory, number>,
  );
  for (const finding of findings) {
    severity[finding.severity]++;
    status[finding.status]++;
    category[finding.category]++;
  }
  return { severity, status, category };
}
