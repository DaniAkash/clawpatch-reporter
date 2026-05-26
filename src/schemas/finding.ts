import { z } from "zod";
import {
  deriveFindingTriage,
  findingCategories,
  findingConfidences,
  findingSeverities,
  findingStatuses,
  findingTriages,
} from "./enums.js";

const evidenceLineSchema = z.number().int().min(0).nullable();

const evidenceRefSchema = z
  .object({
    path: z.string(),
    startLine: evidenceLineSchema,
    endLine: evidenceLineSchema,
    symbol: z.string().nullable(),
    quote: z.string().nullable(),
  })
  .transform((evidence) =>
    evidence.startLine === 0 || evidence.endLine === 0
      ? { ...evidence, startLine: null, endLine: null }
      : evidence,
  );

const findingHistoryEntrySchema = z.object({
  runId: z.string().nullable(),
  kind: z.string(),
  status: z.enum(findingStatuses).nullable(),
  note: z.string().nullable(),
  reasoning: z.string().nullable(),
  commands: z.array(z.string()),
  createdAt: z.string(),
});

export const findingRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    findingId: z.string(),
    featureId: z.string(),
    title: z.string(),
    category: z.enum(findingCategories),
    severity: z.enum(findingSeverities),
    confidence: z.enum(findingConfidences),
    triage: z.enum(findingTriages).optional(),
    evidence: z.array(evidenceRefSchema),
    reasoning: z.string(),
    reproduction: z.string().nullable(),
    recommendation: z.string(),
    whyTestsDoNotAlreadyCoverThis: z.string().optional(),
    suggestedRegressionTest: z.string().nullable().optional(),
    minimumFixScope: z.string().optional(),
    status: z.enum(findingStatuses),
    history: z.array(findingHistoryEntrySchema).optional(),
    signature: z.string(),
    linkedPatchAttemptIds: z.array(z.string()),
    createdByRunId: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .transform((finding) => ({
    ...finding,
    triage: finding.triage ?? deriveFindingTriage(finding.category, finding.confidence),
    whyTestsDoNotAlreadyCoverThis: finding.whyTestsDoNotAlreadyCoverThis ?? "",
    suggestedRegressionTest: finding.suggestedRegressionTest ?? null,
    minimumFixScope: finding.minimumFixScope ?? "",
    history: finding.history ?? [],
  }));

export type FindingRecord = z.infer<typeof findingRecordSchema>;
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;
export type FindingHistoryEntry = z.infer<typeof findingHistoryEntrySchema>;
