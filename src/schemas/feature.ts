import { z } from "zod";
import {
  featureKinds,
  featureStatuses,
  findingConfidences,
  reasoningEffortSchema,
  trustBoundaries,
} from "./enums.js";

const featureFileRefSchema = z.object({
  path: z.string(),
  reason: z.string(),
});

const featureEntrypointSchema = z.object({
  path: z.string(),
  symbol: z.string().nullable(),
  route: z.string().nullable(),
  command: z.string().nullable(),
});

const featureTestRefSchema = z.object({
  path: z.string(),
  command: z.string().nullable(),
});

const analysisEntrySchema = z.object({
  runId: z.string(),
  kind: z.string(),
  summary: z.string(),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  reasoningEffort: reasoningEffortSchema.nullable().optional().default(null),
  createdAt: z.string(),
});

const featureLockSchema = z.object({
  lockedByRunId: z.string(),
  lockedAt: z.string(),
  hostname: z.string(),
  pid: z.number().int(),
});

export const featureRecordSchema = z.object({
  schemaVersion: z.literal(1),
  featureId: z.string(),
  title: z.string(),
  summary: z.string(),
  kind: z.enum(featureKinds),
  source: z.string(),
  confidence: z.enum(findingConfidences),
  entrypoints: z.array(featureEntrypointSchema),
  ownedFiles: z.array(featureFileRefSchema),
  contextFiles: z.array(featureFileRefSchema),
  tests: z.array(featureTestRefSchema),
  tags: z.array(z.string()),
  trustBoundaries: z.array(z.enum(trustBoundaries)),
  status: z.enum(featureStatuses),
  lock: featureLockSchema.nullable(),
  findingIds: z.array(z.string()),
  patchAttemptIds: z.array(z.string()),
  analysisHistory: z.array(analysisEntrySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FeatureRecord = z.infer<typeof featureRecordSchema>;
export type FeatureEntrypoint = z.infer<typeof featureEntrypointSchema>;
export type FeatureFileRef = z.infer<typeof featureFileRefSchema>;
export type AnalysisEntry = z.infer<typeof analysisEntrySchema>;
