import { z } from "zod";
import { patchAttemptStatuses, reasoningEffortSchema } from "./enums.js";

const commandResultSchema = z.object({
  command: z.string(),
  cwd: z.string(),
  exitCode: z.number().int().nullable(),
  durationMs: z.number().int(),
  stdout: z.string(),
  stderr: z.string(),
});

export const patchAttemptSchema = z.object({
  schemaVersion: z.literal(1),
  patchAttemptId: z.string(),
  findingIds: z.array(z.string()),
  featureIds: z.array(z.string()),
  status: z.enum(patchAttemptStatuses),
  plan: z.string(),
  filesChanged: z.array(z.string()),
  commandsRun: z.array(commandResultSchema),
  testResults: z.array(commandResultSchema),
  provider: z
    .object({
      name: z.string(),
      model: z.string().nullable(),
      reasoningEffort: reasoningEffortSchema.nullable().optional().default(null),
      requestId: z.string().nullable(),
      startedAt: z.string(),
      finishedAt: z.string(),
    })
    .nullable(),
  git: z.object({
    baseSha: z.string().nullable(),
    commitSha: z.string().nullable(),
    branchName: z.string().nullable(),
    prUrl: z.string().nullable(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PatchAttempt = z.infer<typeof patchAttemptSchema>;
export type CommandResult = z.infer<typeof commandResultSchema>;
