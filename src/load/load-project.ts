import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ZodType } from "zod";
import {
  clawpatchConfigSchema,
  featureRecordSchema,
  findingRecordSchema,
  patchAttemptSchema,
  projectRecordSchema,
  runRecordSchema,
  type ClawpatchConfig,
  type FeatureRecord,
  type FindingRecord,
  type PatchAttempt,
  type ProjectRecord,
  type RunRecord,
} from "../schemas/index.js";
import { readJsonFile } from "../util/read-json.js";
import { resolveStatePaths, type ResolveOptions, type StatePaths } from "./paths.js";

export type ProjectReport = {
  statePath: string;
  paths: StatePaths;
  project: ProjectRecord;
  config: ClawpatchConfig;
  features: FeatureRecord[];
  findings: FindingRecord[];
  patches: PatchAttempt[];
  runs: RunRecord[];
  availableReportFiles: string[];
  loadedAt: string;
};

export async function loadProject(options: ResolveOptions): Promise<ProjectReport> {
  const paths = await resolveStatePaths(options);
  const [project, config, features, findings, patches, runs, availableReportFiles] =
    await Promise.all([
      readJsonFile(paths.projectFile, projectRecordSchema),
      readJsonFile(paths.configFile, clawpatchConfigSchema),
      readDir(paths.featuresDir, featureRecordSchema),
      readDir(paths.findingsDir, findingRecordSchema),
      readDir(paths.patchesDir, patchAttemptSchema),
      readDir(paths.runsDir, runRecordSchema),
      listMarkdownReports(paths.reportsDir),
    ]);

  return {
    statePath: paths.stateDir,
    paths,
    project,
    config,
    features,
    findings,
    patches,
    runs,
    availableReportFiles,
    loadedAt: new Date().toISOString(),
  };
}

async function readDir<T>(dir: string, schema: ZodType<T>): Promise<T[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  const jsonFiles = entries.filter((name) => name.endsWith(".json")).sort();
  return Promise.all(jsonFiles.map((name) => readJsonFile(join(dir, name), schema)));
}

async function listMarkdownReports(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);
    return entries.filter((name) => name.endsWith(".md")).sort();
  } catch {
    return [];
  }
}
