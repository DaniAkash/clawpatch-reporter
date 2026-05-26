import { describe, expect, it } from "vitest";
import { sortFindings } from "../src/select/sort.js";
import type { FindingRecord } from "../src/schemas/index.js";

function mk(overrides: Partial<FindingRecord>): FindingRecord {
  return {
    schemaVersion: 1,
    findingId: "fnd",
    featureId: "feat",
    title: "t",
    category: "bug",
    severity: "low",
    confidence: "low",
    triage: "risk",
    evidence: [],
    reasoning: "",
    reproduction: null,
    recommendation: "",
    whyTestsDoNotAlreadyCoverThis: "",
    suggestedRegressionTest: null,
    minimumFixScope: "",
    status: "open",
    history: [],
    signature: "sig",
    linkedPatchAttemptIds: [],
    createdByRunId: "r",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as FindingRecord;
}

describe("sortFindings", () => {
  it("sorts severity desc first", () => {
    const sorted = sortFindings([
      mk({ findingId: "a", severity: "low" }),
      mk({ findingId: "b", severity: "critical" }),
      mk({ findingId: "c", severity: "medium" }),
    ]);
    expect(sorted.map((f) => f.findingId)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by confidence desc, then status (open first)", () => {
    const sorted = sortFindings([
      mk({ findingId: "a", severity: "high", confidence: "low", status: "open" }),
      mk({ findingId: "b", severity: "high", confidence: "high", status: "fixed" }),
      mk({ findingId: "c", severity: "high", confidence: "high", status: "open" }),
    ]);
    expect(sorted.map((f) => f.findingId)).toEqual(["c", "b", "a"]);
  });
});
