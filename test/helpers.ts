import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadProject, type ProjectReport } from "../src/load/load-project.js";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_ROOT = join(here, "fixtures", "daniakash-com");

const FIXED_LOADED_AT = "2026-05-26T12:00:00.000Z";

export async function loadFixture(): Promise<ProjectReport> {
  const project = await loadProject({ cwd: process.cwd(), root: FIXTURE_ROOT });
  return { ...project, loadedAt: FIXED_LOADED_AT };
}
