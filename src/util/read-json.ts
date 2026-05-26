import { readFile } from "node:fs/promises";
import type { ZodType } from "zod";
import { ClawpatchReporterError } from "../errors.js";

export async function readJsonFile<T>(filePath: string, schema: ZodType<T>): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    throw new ClawpatchReporterError(
      `Failed to read ${filePath}: ${(error as Error).message}`,
      "io-read-failed",
      { filePath, cause: error },
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ClawpatchReporterError(
      `Invalid JSON in ${filePath}: ${(error as Error).message}`,
      "json-parse-failed",
      { filePath, cause: error },
    );
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ClawpatchReporterError(
      `Record at ${filePath} did not match expected schema`,
      "schema-validation-failed",
      { filePath, issues: result.error.issues },
    );
  }
  return result.data;
}
