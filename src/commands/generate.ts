import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { loadProject, type ProjectReport } from "../load/load-project.js";
import { renderHtml } from "../render/html.js";
import { renderMarkdown } from "../render/markdown.js";
import type { Section } from "../render/types.js";
import type { CliRawOptions } from "../cli.js";
import type {
  FindingCategory,
  FindingSeverity,
  FindingStatus,
  FindingTriage,
} from "../schemas/enums.js";
import { filterFindings } from "../select/filter.js";

export type GenerateOptions = CliRawOptions & {
  sections: string[];
};

export async function runGenerate(options: GenerateOptions): Promise<void> {
  const report = await loadProject({
    cwd: process.cwd(),
    root: options.root,
    stateDir: options.stateDir,
  });

  const findings = filterFindings(report.findings, {
    statuses: options.status as FindingStatus[],
    severities: options.severity as FindingSeverity[],
    categories: options.category as FindingCategory[],
    triages: options.triage as FindingTriage[],
    featureId: options.feature,
    includeFixed: options.includeFixed || options.status.length > 0,
  });

  const renderOpts = {
    sections: options.sections as Section[],
    includeToc: options.toc,
    maxEvidence: options.maxEvidence,
  };
  const content =
    options.format === "html"
      ? renderHtml(report, findings, renderOpts)
      : renderMarkdown(report, findings, renderOpts);

  if (options.stdout) {
    process.stdout.write(content);
    if (!options.quiet) {
      process.stderr.write(
        `Rendered ${findings.length} of ${report.findings.length} findings (stdout).\n`,
      );
    }
    return;
  }

  const targetPath = resolveTargetPath(report, options);
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, "utf8");
  if (!options.quiet) {
    process.stdout.write(
      `Wrote ${options.format.toUpperCase()} report: ${targetPath} (${findings.length} of ${report.findings.length} findings)\n`,
    );
  }
}

function resolveTargetPath(report: ProjectReport, options: GenerateOptions): string {
  const cwd = process.cwd();
  const ext = options.format === "html" ? "html" : "md";
  const defaultName = `report.${ext}`;
  if (!options.output) {
    return join(report.paths.outputDir, defaultName);
  }
  const absoluteish = isAbsolute(options.output) ? options.output : resolve(cwd, options.output);
  const lower = absoluteish.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".html")) {
    return absoluteish;
  }
  return join(absoluteish, defaultName);
}
