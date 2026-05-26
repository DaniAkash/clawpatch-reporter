import { z } from "zod";
import { findingConfidences, reasoningEffortSchema } from "./enums.js";

const projectCommandsSchema = z.object({
  typecheck: z.string().nullable(),
  lint: z.string().nullable(),
  format: z.string().nullable(),
  test: z.string().nullable(),
});

export const clawpatchConfigSchema = z.object({
  schemaVersion: z.literal(1),
  stateDir: z.string(),
  include: z.array(z.string()),
  exclude: z.array(z.string()),
  provider: z.object({
    name: z.string(),
    model: z.string().nullable(),
    reasoningEffort: reasoningEffortSchema.nullable().optional().default(null),
  }),
  commands: projectCommandsSchema,
  review: z.object({
    maxContextFiles: z.number().int().positive(),
    maxOwnedFiles: z.number().int().positive(),
    maxFindingsPerFeature: z.number().int().positive(),
    minConfidenceToFix: z.enum(findingConfidences),
  }),
  git: z.object({
    requireCleanWorktreeForFix: z.boolean(),
    commit: z.boolean(),
    openPr: z.boolean(),
  }),
});

export type ClawpatchConfig = z.infer<typeof clawpatchConfigSchema>;
