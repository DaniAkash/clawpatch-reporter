import { z } from "zod";

const projectCommandsSchema = z.object({
  typecheck: z.string().nullable(),
  lint: z.string().nullable(),
  format: z.string().nullable(),
  test: z.string().nullable(),
});

export const projectRecordSchema = z.object({
  schemaVersion: z.literal(1),
  projectId: z.string(),
  name: z.string(),
  rootPath: z.string(),
  git: z.object({
    remoteUrl: z.string().nullable(),
    defaultBranch: z.string().nullable(),
    currentBranch: z.string().nullable(),
    headSha: z.string().nullable(),
  }),
  detected: z.object({
    languages: z.array(z.string()),
    frameworks: z.array(z.string()),
    packageManagers: z.array(z.string()),
    commands: projectCommandsSchema,
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectRecord = z.infer<typeof projectRecordSchema>;
export type ProjectCommands = z.infer<typeof projectCommandsSchema>;
