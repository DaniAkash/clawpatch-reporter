import { stat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { ClawpatchReporterError } from "../errors.js";

export type StatePaths = {
  stateDir: string;
  projectRoot: string;
  configFile: string;
  projectFile: string;
  featuresDir: string;
  findingsDir: string;
  patchesDir: string;
  runsDir: string;
  reportsDir: string;
  outputDir: string;
};

export type ResolveOptions = {
  cwd: string;
  root?: string | undefined;
  stateDir?: string | undefined;
};

export async function resolveStatePaths(options: ResolveOptions): Promise<StatePaths> {
  const root = options.root ?? options.cwd;
  const projectRoot = isAbsolute(root) ? root : resolve(options.cwd, root);
  const stateDir = options.stateDir
    ? isAbsolute(options.stateDir)
      ? options.stateDir
      : resolve(options.cwd, options.stateDir)
    : join(projectRoot, ".clawpatch");

  const exists = await pathExists(stateDir);
  if (!exists) {
    throw new ClawpatchReporterError(
      `No .clawpatch state directory found at ${stateDir}. ` +
        `Run \`clawpatch init\` in the project first, or pass --state-dir.`,
      "state-dir-missing",
      { stateDir },
    );
  }

  return {
    stateDir,
    projectRoot,
    configFile: join(stateDir, "config.json"),
    projectFile: join(stateDir, "project.json"),
    featuresDir: join(stateDir, "features"),
    findingsDir: join(stateDir, "findings"),
    patchesDir: join(stateDir, "patches"),
    runsDir: join(stateDir, "runs"),
    reportsDir: join(stateDir, "reports"),
    outputDir: join(stateDir, "reporter"),
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
