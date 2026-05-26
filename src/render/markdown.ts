import type { ProjectReport } from "../load/load-project.js";
import type { FeatureRecord, FindingRecord, PatchAttempt } from "../schemas/index.js";
import { sortFindings } from "../select/sort.js";
import { slugify } from "../util/slugify.js";
import { truncate } from "../util/truncate.js";
import { evidenceLocation, evidenceRange, languageForPath } from "./shared/evidence.js";
import { tallyFindings } from "./shared/counts.js";
import {
  CATEGORY_ORDER,
  SEVERITY_ORDER,
  STATUS_ORDER,
  severityIcon,
  statusGlyph,
} from "./shared/labels.js";
import { DEFAULT_RENDER_OPTIONS, type RenderOptions } from "./types.js";

export function renderMarkdown(
  report: ProjectReport,
  findings: FindingRecord[],
  options: RenderOptions = {},
): string {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };
  const sections = new Set(opts.sections);
  const sortedFindings = sortFindings(findings);
  const featureById = new Map(report.features.map((f) => [f.featureId, f]));
  const out: string[] = [];

  out.push(renderHeader(report, opts.generatedAt ?? report.loadedAt));
  out.push("");
  out.push(renderHeadlineAlert(sortedFindings));

  if (opts.includeToc) {
    out.push(renderToc(sortedFindings, report.features, report.patches, sections));
  }

  if (sections.has("summary")) {
    out.push(renderSummarySection(sortedFindings));
  }
  if (sections.has("findings")) {
    out.push(renderFindingsSection(sortedFindings, featureById, opts));
  }
  if (sections.has("features")) {
    out.push(renderFeaturesSection(report.features));
  }
  if (sections.has("patches")) {
    out.push(renderPatchesSection(report.patches));
  }

  out.push(renderFooter());
  return `${out.filter(Boolean).join("\n\n")}\n`;
}

function renderHeader(report: ProjectReport, generatedAt: string): string {
  const lines = [
    `# Clawpatch report: ${report.project.name}`,
    "",
    "```yaml",
    `project: ${report.project.name}`,
    `remote: ${report.project.git.remoteUrl ?? "(not configured)"}`,
    `branch: ${report.project.git.currentBranch ?? "(detached)"}`,
    `head: ${report.project.git.headSha ?? "(unknown)"}`,
    `generated: ${generatedAt}`,
    `features: ${report.features.length}`,
    `findings: ${report.findings.length}`,
    `patches: ${report.patches.length}`,
    `runs: ${report.runs.length}`,
    "```",
  ];
  return lines.join("\n");
}

function renderHeadlineAlert(findings: FindingRecord[]): string {
  const open = findings.filter((f) => f.status === "open");
  const critical = open.filter((f) => f.severity === "critical").length;
  const high = open.filter((f) => f.severity === "high").length;
  if (critical > 0) {
    return `> [!CAUTION]\n> ${critical} critical and ${high} high-severity open findings.`;
  }
  if (high > 0) {
    return `> [!WARNING]\n> ${high} high-severity open findings.`;
  }
  if (open.length > 0) {
    return `> [!NOTE]\n> ${open.length} open findings.`;
  }
  return `> [!TIP]\n> No open findings.`;
}

function renderToc(
  findings: FindingRecord[],
  features: FeatureRecord[],
  patches: PatchAttempt[],
  sections: Set<string>,
): string {
  const lines = ["## Contents", ""];
  if (sections.has("summary")) {
    lines.push("- [Summary](#summary)");
  }
  if (sections.has("findings")) {
    lines.push("- [Findings](#findings)");
    for (const finding of findings) {
      lines.push(`  - ${severityIcon(finding.severity)} [${escape(finding.title)}](#${findingAnchor(finding)})`);
    }
  }
  if (sections.has("features")) {
    lines.push("- [Features](#features)");
    if (features.length <= 20) {
      for (const feature of features) {
        lines.push(`  - [${escape(feature.title)}](#${featureAnchor(feature)})`);
      }
    }
  }
  if (sections.has("patches") && patches.length > 0) {
    lines.push("- [Patches](#patches)");
  }
  return lines.join("\n");
}

function renderSummarySection(findings: FindingRecord[]): string {
  const counts = tallyFindings(findings);
  const total = findings.length;
  const lines = [
    "## Summary",
    "",
    `**Total findings:** ${total}`,
    "",
    "### By severity",
    "",
    "| Severity | Count |",
    "| --- | ---: |",
  ];
  for (const sev of SEVERITY_ORDER) {
    lines.push(`| ${severityIcon(sev)} ${sev} | ${counts.severity[sev]} |`);
  }
  lines.push("", "### By status", "", "| Status | Count |", "| --- | ---: |");
  for (const status of STATUS_ORDER) {
    lines.push(`| ${statusGlyph(status)} ${status} | ${counts.status[status]} |`);
  }
  lines.push("", "### By category", "", "| Category | Count |", "| --- | ---: |");
  for (const cat of CATEGORY_ORDER) {
    if (counts.category[cat] > 0) {
      lines.push(`| ${cat} | ${counts.category[cat]} |`);
    }
  }
  return lines.join("\n");
}

function renderFindingsSection(
  findings: FindingRecord[],
  featureById: Map<string, FeatureRecord>,
  opts: { maxEvidence: number; truncateReasoning: number | null },
): string {
  const lines = ["## Findings", ""];
  if (findings.length === 0) {
    lines.push("_No findings match the current filters._");
    return lines.join("\n");
  }
  for (const finding of findings) {
    lines.push(renderFinding(finding, featureById, opts));
  }
  return lines.join("\n\n");
}

function renderFinding(
  finding: FindingRecord,
  featureById: Map<string, FeatureRecord>,
  opts: { maxEvidence: number; truncateReasoning: number | null },
): string {
  const feature = featureById.get(finding.featureId);
  const featureCell = feature
    ? `[${escape(feature.title)}](#${featureAnchor(feature)})`
    : `\`${finding.featureId}\``;

  const lines: string[] = [];
  lines.push(`### ${severityIcon(finding.severity)} ${finding.severity}: ${finding.title}`);
  lines.push("");
  lines.push(`<a id="${findingAnchor(finding)}"></a>`);
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| ID | \`${finding.findingId}\` |`);
  lines.push(`| Feature | ${featureCell} |`);
  lines.push(`| Category | ${finding.category} |`);
  lines.push(`| Confidence | ${finding.confidence} |`);
  lines.push(`| Triage | ${finding.triage} |`);
  lines.push(`| Status | ${statusGlyph(finding.status)} ${finding.status} |`);

  if (finding.evidence.length > 0) {
    lines.push("");
    lines.push("<details>");
    const summary =
      finding.evidence.length === 1 ? "Evidence" : `Evidence (${finding.evidence.length} items)`;
    lines.push(`<summary>${summary}</summary>`);
    lines.push("");
    const shown = finding.evidence.slice(0, opts.maxEvidence);
    for (const ev of shown) {
      const loc = evidenceLocation(ev);
      const symbol = ev.symbol ? ` \`${ev.symbol}\`` : "";
      lines.push(`- \`${loc}\`${symbol}`);
      if (ev.quote) {
        const lang = languageForPath(ev.path);
        lines.push("");
        lines.push(`  \`\`\`${lang}`);
        for (const line of ev.quote.split("\n")) {
          lines.push(`  ${line}`);
        }
        lines.push("  ```");
      }
    }
    if (finding.evidence.length > shown.length) {
      const hidden = finding.evidence.length - shown.length;
      lines.push("");
      lines.push(`_${hidden} more evidence ${hidden === 1 ? "item" : "items"} hidden._`);
    }
    lines.push("");
    lines.push("</details>");
  }

  lines.push("");
  lines.push("**Reasoning**");
  lines.push("");
  lines.push(maybeTruncate(finding.reasoning, opts.truncateReasoning));

  if (finding.recommendation.trim().length > 0) {
    lines.push("");
    lines.push("**Recommendation**");
    lines.push("");
    lines.push(maybeTruncate(finding.recommendation, opts.truncateReasoning));
  }

  if (finding.minimumFixScope.trim().length > 0) {
    lines.push("");
    lines.push("**Minimum fix scope**");
    lines.push("");
    lines.push(maybeTruncate(finding.minimumFixScope, opts.truncateReasoning));
  }

  if (finding.reproduction && finding.reproduction.trim().length > 0) {
    lines.push("");
    lines.push("**Reproduction**");
    lines.push("");
    lines.push(maybeTruncate(finding.reproduction, opts.truncateReasoning));
  }

  if (finding.whyTestsDoNotAlreadyCoverThis.trim().length > 0) {
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Test analysis</summary>");
    lines.push("");
    lines.push(maybeTruncate(finding.whyTestsDoNotAlreadyCoverThis, opts.truncateReasoning));
    if (finding.suggestedRegressionTest && finding.suggestedRegressionTest.trim().length > 0) {
      lines.push("");
      lines.push("**Suggested regression test**");
      lines.push("");
      lines.push(maybeTruncate(finding.suggestedRegressionTest, opts.truncateReasoning));
    }
    lines.push("");
    lines.push("</details>");
  }

  return lines.join("\n");
}

function renderFeaturesSection(features: FeatureRecord[]): string {
  const lines = ["## Features", ""];
  if (features.length === 0) {
    lines.push("_No features mapped yet._");
    return lines.join("\n");
  }
  lines.push("| Title | Kind | Status | Findings | Entrypoint |");
  lines.push("| --- | --- | --- | ---: | --- |");
  for (const feature of features) {
    const entry = feature.entrypoints[0]?.path ?? "—";
    lines.push(
      `| <a id="${featureAnchor(feature)}"></a>${escape(feature.title)} | ${feature.kind} | ${feature.status} | ${feature.findingIds.length} | \`${entry}\` |`,
    );
  }
  return lines.join("\n");
}

function renderPatchesSection(patches: PatchAttempt[]): string {
  const lines = ["## Patches", ""];
  if (patches.length === 0) {
    lines.push("_No patch attempts recorded._");
    return lines.join("\n");
  }
  for (const patch of patches) {
    lines.push(`### \`${patch.patchAttemptId}\``);
    lines.push("");
    lines.push(`- **Status:** ${patch.status}`);
    lines.push(`- **Findings:** ${patch.findingIds.length}`);
    lines.push(`- **Files changed:** ${patch.filesChanged.length}`);
    if (patch.git.prUrl) {
      lines.push(`- **PR:** ${patch.git.prUrl}`);
    }
    if (patch.git.commitSha) {
      lines.push(`- **Commit:** \`${patch.git.commitSha}\``);
    }
    if (patch.plan.trim().length > 0) {
      lines.push("");
      lines.push("**Plan**");
      lines.push("");
      lines.push(patch.plan);
    }
    if (patch.filesChanged.length > 0) {
      lines.push("");
      lines.push("<details>");
      lines.push(`<summary>Files changed (${patch.filesChanged.length})</summary>`);
      lines.push("");
      for (const file of patch.filesChanged) {
        lines.push(`- \`${file}\``);
      }
      lines.push("");
      lines.push("</details>");
    }
    if (patch.commandsRun.length > 0) {
      lines.push("");
      lines.push("<details>");
      lines.push(`<summary>Commands run (${patch.commandsRun.length})</summary>`);
      lines.push("");
      lines.push("| Command | Exit | Duration |");
      lines.push("| --- | ---: | ---: |");
      for (const cmd of patch.commandsRun) {
        lines.push(`| \`${cmd.command}\` | ${cmd.exitCode ?? "—"} | ${cmd.durationMs}ms |`);
      }
      lines.push("");
      lines.push("</details>");
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderFooter(): string {
  return "---\n\n_Generated by clawpatch-reporter from `.clawpatch/` state._";
}

function maybeTruncate(text: string, max: number | null): string {
  if (max === null) return text;
  const { text: out, truncated } = truncate(text, max);
  return truncated ? `${out}\n\n_(truncated)_` : out;
}

function findingAnchor(finding: FindingRecord): string {
  return `fnd-${slugify(finding.findingId)}`;
}

function featureAnchor(feature: FeatureRecord): string {
  return `feat-${slugify(feature.featureId)}`;
}

function escape(text: string): string {
  return text.replace(/\|/g, "\\|");
}

export { evidenceRange };
