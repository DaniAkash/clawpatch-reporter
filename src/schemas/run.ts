import { z } from "zod";
import { runStatuses } from "./enums.js";

export const runRecordSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  rootPath: z.string(),
  headSha: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  status: z.enum(runStatuses),
  claimedFeatureIds: z.array(z.string()),
  findingIds: z.array(z.string()),
  patchAttemptIds: z.array(z.string()),
  errors: z.array(
    z.object({
      message: z.string(),
      code: z.string().nullable(),
    }),
  ),
});

export type RunRecord = z.infer<typeof runRecordSchema>;
