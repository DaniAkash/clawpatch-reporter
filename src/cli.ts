#!/usr/bin/env node
import { Command, Option } from "commander";
import { runGenerate } from "./commands/generate.js";
import { ClawpatchReporterError } from "./errors.js";
import {
  findingCategories,
  findingSeverities,
  findingStatuses,
  findingTriages,
} from "./schemas/enums.js";

export type CliRawOptions = {
  root: string | undefined;
  stateDir: string | undefined;
  format: "md" | "html";
  output: string | undefined;
  stdout: boolean;
  status: string[];
  severity: string[];
  category: string[];
  triage: string[];
  feature: string | undefined;
  includeFixed: boolean;
  toc: boolean;
  maxEvidence: number;
  quiet: boolean;
  sections: string[];
};

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("clawpatch-reporter")
    .description("Render clawpatch findings as Markdown or HTML reports")
    .version(readPackageVersion(), "--version", "Print version and exit")
    .showHelpAfterError();

  attachSharedOptions(program);

  program
    .command("generate", { isDefault: true })
    .description("Produce a full report (summary + findings + features + patches)")
    .action(async (_args: unknown, cmd: Command) => {
      await execute(cmd, ["summary", "findings", "features", "patches"]);
    });

  program
    .command("findings")
    .description("Render the findings section only")
    .action(async (_args: unknown, cmd: Command) => {
      await execute(cmd, ["findings"]);
    });

  program
    .command("features")
    .description("Render the features section only")
    .action(async (_args: unknown, cmd: Command) => {
      await execute(cmd, ["features"]);
    });

  program
    .command("summary")
    .description("Render the summary counts only")
    .action(async (_args: unknown, cmd: Command) => {
      await execute(cmd, ["summary"]);
    });

  return program;
}

function attachSharedOptions(program: Command): void {
  for (const cmd of [program, ...program.commands]) {
    cmd
      .option("--root <path>", "Project root containing the .clawpatch directory")
      .option("--state-dir <path>", "Override the .clawpatch state directory directly")
      .addOption(
        new Option("--format <fmt>", "Output format")
          .choices(["md", "html"])
          .default("md"),
      )
      .option("--output <path>", "Output file path (overrides default)")
      .option("--stdout", "Write to stdout instead of disk", false)
      .option(
        "--status <status>",
        "Filter by finding status (repeatable)",
        collect,
        [],
      )
      .option(
        "--severity <severity>",
        "Filter by finding severity (repeatable)",
        collect,
        [],
      )
      .option(
        "--category <category>",
        "Filter by finding category (repeatable)",
        collect,
        [],
      )
      .option(
        "--triage <triage>",
        "Filter by finding triage (repeatable)",
        collect,
        [],
      )
      .option("--feature <id>", "Filter to a single feature by id")
      .option("--include-fixed", "Include findings with status=fixed", false)
      .option("--no-toc", "Omit the table of contents")
      .option(
        "--max-evidence <n>",
        "Maximum evidence entries shown per finding",
        parseIntFlag,
        8,
      )
      .option("--quiet", "Suppress progress chatter", false);
  }
}

async function execute(cmd: Command, sections: string[]): Promise<void> {
  const merged = mergeOptions(cmd);
  try {
    validateOptions(merged);
  } catch (error) {
    if (error instanceof ClawpatchReporterError) {
      cmd.error(error.message, { exitCode: 2, code: error.code });
    }
    throw error;
  }
  try {
    await runGenerate({ ...merged, sections });
  } catch (error) {
    if (error instanceof ClawpatchReporterError) {
      const detail =
        error.code === "schema-validation-failed" && error.details
          ? `\n  ${JSON.stringify(error.details)}`
          : "";
      cmd.error(`${error.message}${detail}`, { exitCode: 1, code: error.code });
    }
    throw error;
  }
}

function mergeOptions(cmd: Command): CliRawOptions {
  const opts = cmd.optsWithGlobals() as Partial<CliRawOptions>;
  return {
    root: opts.root,
    stateDir: opts.stateDir,
    format: (opts.format ?? "md") as "md" | "html",
    output: opts.output,
    stdout: opts.stdout ?? false,
    status: opts.status ?? [],
    severity: opts.severity ?? [],
    category: opts.category ?? [],
    triage: opts.triage ?? [],
    feature: opts.feature,
    includeFixed: opts.includeFixed ?? false,
    toc: opts.toc ?? true,
    maxEvidence: opts.maxEvidence ?? 8,
    quiet: opts.quiet ?? false,
    sections: [],
  };
}

function validateOptions(opts: CliRawOptions): void {
  for (const status of opts.status) {
    if (!(findingStatuses as readonly string[]).includes(status)) {
      throw new ClawpatchReporterError(
        `Unknown --status value: ${status}. Valid: ${findingStatuses.join(", ")}`,
        "invalid-status",
      );
    }
  }
  for (const sev of opts.severity) {
    if (!(findingSeverities as readonly string[]).includes(sev)) {
      throw new ClawpatchReporterError(
        `Unknown --severity value: ${sev}. Valid: ${findingSeverities.join(", ")}`,
        "invalid-severity",
      );
    }
  }
  for (const cat of opts.category) {
    if (!(findingCategories as readonly string[]).includes(cat)) {
      throw new ClawpatchReporterError(
        `Unknown --category value: ${cat}. Valid: ${findingCategories.join(", ")}`,
        "invalid-category",
      );
    }
  }
  for (const triage of opts.triage) {
    if (!(findingTriages as readonly string[]).includes(triage)) {
      throw new ClawpatchReporterError(
        `Unknown --triage value: ${triage}. Valid: ${findingTriages.join(", ")}`,
        "invalid-triage",
      );
    }
  }
  if (opts.output) {
    const lower = opts.output.toLowerCase();
    if (lower.endsWith(".md") && opts.format !== "md") {
      throw new ClawpatchReporterError(
        "--output extension .md does not match --format html",
        "output-format-mismatch",
      );
    }
    if (lower.endsWith(".html") && opts.format !== "html") {
      throw new ClawpatchReporterError(
        "--output extension .html does not match --format md",
        "output-format-mismatch",
      );
    }
  }
}

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

function parseIntFlag(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new ClawpatchReporterError(
      `Expected a non-negative integer, got: ${value}`,
      "invalid-number",
    );
  }
  return n;
}

function readPackageVersion(): string {
  return "0.0.1";
}

const program = buildProgram();
program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
