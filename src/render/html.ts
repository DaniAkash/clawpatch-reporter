import type { ProjectReport } from "../load/load-project.js";
import type { FeatureRecord, FindingRecord, PatchAttempt } from "../schemas/index.js";
import { sortFindings } from "../select/sort.js";
import { escapeHtml } from "../util/escape-html.js";
import { slugify } from "../util/slugify.js";
import { truncate } from "../util/truncate.js";
import { evidenceLocation, languageForPath } from "./shared/evidence.js";
import { tallyFindings } from "./shared/counts.js";
import {
  CATEGORY_ORDER,
  SEVERITY_ORDER,
  STATUS_ORDER,
  severityIcon,
  statusGlyph,
} from "./shared/labels.js";
import { DEFAULT_RENDER_OPTIONS, type RenderOptions } from "./types.js";

const NEW_CSS_URL = "https://newcss.net/new.min.css";

const SCOPED_CSS = `
:root {
  --pill-critical: #c0212f;
  --pill-high: #d9480f;
  --pill-medium: #c47f17;
  --pill-low: #2f7a4f;
  --pill-open: #1c63a8;
  --pill-fixed: #2f7a4f;
  --pill-fp: #6b7280;
  --pill-wont: #6b7280;
  --pill-uncertain: #7c3aed;
  --pill-fg: #fff;
  --row-bg: rgba(0, 0, 0, 0.025);
}
@media (prefers-color-scheme: dark) {
  :root {
    --row-bg: rgba(255, 255, 255, 0.04);
  }
}
.metadata-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-size: 0.95rem;
  color: var(--text-color, inherit);
  margin-top: 0.25rem;
}
.metadata-bar code {
  font-size: 0.9em;
}
.pill {
  display: inline-block;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--pill-fg);
  vertical-align: middle;
}
.pill-severity-critical { background: var(--pill-critical); }
.pill-severity-high { background: var(--pill-high); }
.pill-severity-medium { background: var(--pill-medium); }
.pill-severity-low { background: var(--pill-low); }
.pill-status-open { background: var(--pill-open); }
.pill-status-fixed { background: var(--pill-fixed); }
.pill-status-false-positive { background: var(--pill-fp); }
.pill-status-wont-fix { background: var(--pill-wont); }
.pill-status-uncertain { background: var(--pill-uncertain); }
.summary-tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}
.summary-tables table {
  width: 100%;
}
.finding-meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 1rem;
  margin: 0.75rem 0 1rem;
}
.finding-meta dt {
  font-weight: 600;
  opacity: 0.7;
}
.finding-meta dd {
  margin: 0;
}
article.finding {
  padding: 1rem 0;
  border-top: 1px solid rgba(127, 127, 127, 0.25);
}
article.finding header h3 {
  margin: 0 0 0.5rem;
}
article.finding .pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
details {
  margin: 0.75rem 0;
}
details > summary {
  cursor: pointer;
  font-weight: 600;
}
pre {
  overflow-x: auto;
}
nav.toc ul {
  padding-left: 1.2rem;
}
nav.toc ul ul {
  padding-left: 1rem;
  font-size: 0.9rem;
}
.callout {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  border-left: 4px solid currentColor;
  background: var(--row-bg);
}
.callout-caution { color: var(--pill-critical); }
.callout-warning { color: var(--pill-high); }
.callout-note { color: var(--pill-open); }
.callout-tip { color: var(--pill-fixed); }
`;

export function renderHtml(
  report: ProjectReport,
  findings: FindingRecord[],
  options: RenderOptions = {},
): string {
  const opts = { ...DEFAULT_RENDER_OPTIONS, ...options };
  const sections = new Set(opts.sections);
  const sortedFindings = sortFindings(findings);
  const featureById = new Map(report.features.map((f) => [f.featureId, f]));
  const generatedAt = opts.generatedAt ?? report.loadedAt;

  const head = renderHead(report);
  const body = [
    renderTopHeader(report, generatedAt),
    renderCallout(sortedFindings),
    opts.includeToc
      ? renderToc(sortedFindings, report.features, report.patches, sections)
      : "",
    `<main>`,
    sections.has("summary") ? renderSummary(sortedFindings) : "",
    sections.has("findings") ? renderFindings(sortedFindings, featureById, opts) : "",
    sections.has("features") ? renderFeatures(report.features) : "",
    sections.has("patches") ? renderPatches(report.patches) : "",
    `</main>`,
    renderFooter(),
  ]
    .filter(Boolean)
    .join("\n");

  return `<!doctype html>
<html lang="en">
${head}
<body>
${body}
</body>
</html>
`;
}

function renderHead(report: ProjectReport): string {
  return `<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Clawpatch report: ${escapeHtml(report.project.name)}</title>
<link rel="stylesheet" href="${NEW_CSS_URL}" />
<style>${SCOPED_CSS}</style>
</head>`;
}

function renderTopHeader(report: ProjectReport, generatedAt: string): string {
  const remote = report.project.git.remoteUrl
    ? `<a href="${escapeHtml(report.project.git.remoteUrl)}">${escapeHtml(report.project.git.remoteUrl)}</a>`
    : "<em>(not configured)</em>";
  return `<header>
<h1>Clawpatch report</h1>
<div class="metadata-bar">
  <span><strong>${escapeHtml(report.project.name)}</strong></span>
  <span>${remote}</span>
  <span>branch <code>${escapeHtml(report.project.git.currentBranch ?? "(detached)")}</code></span>
  <span>head <code>${escapeHtml((report.project.git.headSha ?? "unknown").slice(0, 12))}</code></span>
  <span>generated ${escapeHtml(generatedAt)}</span>
  <span>${report.features.length} features · ${report.findings.length} findings · ${report.patches.length} patches</span>
</div>
</header>`;
}

function renderCallout(findings: FindingRecord[]): string {
  const open = findings.filter((f) => f.status === "open");
  const critical = open.filter((f) => f.severity === "critical").length;
  const high = open.filter((f) => f.severity === "high").length;
  if (critical > 0) {
    return `<div class="callout callout-caution"><strong>Caution.</strong> ${critical} critical and ${high} high-severity open findings.</div>`;
  }
  if (high > 0) {
    return `<div class="callout callout-warning"><strong>Warning.</strong> ${high} high-severity open findings.</div>`;
  }
  if (open.length > 0) {
    return `<div class="callout callout-note"><strong>Note.</strong> ${open.length} open findings.</div>`;
  }
  return `<div class="callout callout-tip"><strong>Tip.</strong> No open findings.</div>`;
}

function renderToc(
  findings: FindingRecord[],
  features: FeatureRecord[],
  patches: PatchAttempt[],
  sections: Set<string>,
): string {
  const items: string[] = [];
  if (sections.has("summary")) {
    items.push(`<li><a href="#summary">Summary</a></li>`);
  }
  if (sections.has("findings")) {
    const subs = findings
      .map(
        (f) =>
          `<li><a href="#${findingAnchor(f)}">${severityIcon(f.severity)} ${escapeHtml(f.title)}</a></li>`,
      )
      .join("\n");
    items.push(`<li><a href="#findings">Findings</a><ul>\n${subs}\n</ul></li>`);
  }
  if (sections.has("features")) {
    if (features.length <= 20) {
      const subs = features
        .map(
          (f) =>
            `<li><a href="#${featureAnchor(f)}">${escapeHtml(f.title)}</a></li>`,
        )
        .join("\n");
      items.push(`<li><a href="#features">Features</a><ul>\n${subs}\n</ul></li>`);
    } else {
      items.push(`<li><a href="#features">Features</a></li>`);
    }
  }
  if (sections.has("patches") && patches.length > 0) {
    items.push(`<li><a href="#patches">Patches</a></li>`);
  }
  return `<nav class="toc" aria-label="Report sections">
<h2>Contents</h2>
<ul>
${items.join("\n")}
</ul>
</nav>`;
}

function renderSummary(findings: FindingRecord[]): string {
  const counts = tallyFindings(findings);
  const sevRows = SEVERITY_ORDER.map(
    (sev) =>
      `<tr><td>${severityIcon(sev)} <span class="pill pill-severity-${sev}">${sev}</span></td><td>${counts.severity[sev]}</td></tr>`,
  ).join("\n");
  const statusRows = STATUS_ORDER.map(
    (s) =>
      `<tr><td>${statusGlyph(s)} <span class="pill pill-status-${s}">${s}</span></td><td>${counts.status[s]}</td></tr>`,
  ).join("\n");
  const catRows = CATEGORY_ORDER.filter((c) => counts.category[c] > 0)
    .map((c) => `<tr><td>${c}</td><td>${counts.category[c]}</td></tr>`)
    .join("\n");
  return `<section id="summary" aria-labelledby="summary-h">
<h2 id="summary-h">Summary</h2>
<p><strong>Total findings:</strong> ${findings.length}</p>
<div class="summary-tables">
  <table><caption>By severity</caption><thead><tr><th>Severity</th><th>Count</th></tr></thead><tbody>
${sevRows}
  </tbody></table>
  <table><caption>By status</caption><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>
${statusRows}
  </tbody></table>
  ${
    catRows.length > 0
      ? `<table><caption>By category</caption><thead><tr><th>Category</th><th>Count</th></tr></thead><tbody>${catRows}</tbody></table>`
      : ""
  }
</div>
</section>`;
}

function renderFindings(
  findings: FindingRecord[],
  featureById: Map<string, FeatureRecord>,
  opts: { maxEvidence: number; truncateReasoning: number | null },
): string {
  if (findings.length === 0) {
    return `<section id="findings" aria-labelledby="findings-h">
<h2 id="findings-h">Findings</h2>
<p><em>No findings match the current filters.</em></p>
</section>`;
  }
  const articles = findings
    .map((finding) => renderFinding(finding, featureById, opts))
    .join("\n");
  return `<section id="findings" aria-labelledby="findings-h">
<h2 id="findings-h">Findings</h2>
${articles}
</section>`;
}

function renderFinding(
  finding: FindingRecord,
  featureById: Map<string, FeatureRecord>,
  opts: { maxEvidence: number; truncateReasoning: number | null },
): string {
  const feature = featureById.get(finding.featureId);
  const featureCell = feature
    ? `<a href="#${featureAnchor(feature)}">${escapeHtml(feature.title)}</a>`
    : `<code>${escapeHtml(finding.featureId)}</code>`;

  const meta = `<dl class="finding-meta">
<dt>ID</dt><dd><code>${escapeHtml(finding.findingId)}</code></dd>
<dt>Feature</dt><dd>${featureCell}</dd>
<dt>Category</dt><dd>${escapeHtml(finding.category)}</dd>
<dt>Confidence</dt><dd>${escapeHtml(finding.confidence)}</dd>
<dt>Triage</dt><dd>${escapeHtml(finding.triage)}</dd>
</dl>`;

  const evidence = renderEvidence(finding, opts.maxEvidence);
  const reasoning = renderProseBlock("Reasoning", finding.reasoning, opts.truncateReasoning);
  const recommendation =
    finding.recommendation.trim().length > 0
      ? renderProseBlock("Recommendation", finding.recommendation, opts.truncateReasoning)
      : "";
  const fixScope =
    finding.minimumFixScope.trim().length > 0
      ? renderProseBlock("Minimum fix scope", finding.minimumFixScope, opts.truncateReasoning)
      : "";
  const repro =
    finding.reproduction && finding.reproduction.trim().length > 0
      ? renderProseBlock("Reproduction", finding.reproduction, opts.truncateReasoning)
      : "";
  const testAnalysis = renderTestAnalysis(finding, opts.truncateReasoning);

  return `<article class="finding" id="${findingAnchor(finding)}" data-severity="${finding.severity}" data-status="${finding.status}">
<header>
<h3>${severityIcon(finding.severity)} ${escapeHtml(finding.title)}</h3>
<div class="pills">
<span class="pill pill-severity-${finding.severity}">${finding.severity}</span>
<span class="pill pill-status-${finding.status}">${statusGlyph(finding.status)} ${finding.status}</span>
</div>
</header>
${meta}
${evidence}
${reasoning}
${recommendation}
${fixScope}
${repro}
${testAnalysis}
</article>`;
}

function renderEvidence(finding: FindingRecord, maxEvidence: number): string {
  if (finding.evidence.length === 0) {
    return "";
  }
  const shown = finding.evidence.slice(0, maxEvidence);
  const items = shown
    .map((ev) => {
      const loc = evidenceLocation(ev);
      const symbol = ev.symbol ? ` <code>${escapeHtml(ev.symbol)}</code>` : "";
      const head = `<code>${escapeHtml(loc)}</code>${symbol}`;
      if (!ev.quote) {
        return `<li>${head}</li>`;
      }
      const lang = languageForPath(ev.path);
      const cls = lang ? ` class="language-${lang}"` : "";
      return `<li>${head}
<pre><code${cls}>${escapeHtml(ev.quote)}</code></pre>
</li>`;
    })
    .join("\n");
  const hidden = finding.evidence.length - shown.length;
  const hiddenNote =
    hidden > 0
      ? `<p><em>${hidden} more ${hidden === 1 ? "item" : "items"} hidden.</em></p>`
      : "";
  const summary =
    finding.evidence.length === 1 ? "Evidence" : `Evidence (${finding.evidence.length} items)`;
  return `<details open>
<summary>${summary}</summary>
<ul>
${items}
</ul>
${hiddenNote}
</details>`;
}

function renderProseBlock(label: string, text: string, max: number | null): string {
  const content = maybeTruncate(text, max);
  return `<section>
<h4>${escapeHtml(label)}</h4>
<p>${escapeHtml(content).replace(/\n\n+/g, "</p>\n<p>").replace(/\n/g, "<br>")}</p>
</section>`;
}

function renderTestAnalysis(finding: FindingRecord, max: number | null): string {
  if (finding.whyTestsDoNotAlreadyCoverThis.trim().length === 0) {
    return "";
  }
  const main = maybeTruncate(finding.whyTestsDoNotAlreadyCoverThis, max);
  const suggested =
    finding.suggestedRegressionTest && finding.suggestedRegressionTest.trim().length > 0
      ? `<h5>Suggested regression test</h5>
<p>${escapeHtml(maybeTruncate(finding.suggestedRegressionTest, max)).replace(/\n/g, "<br>")}</p>`
      : "";
  return `<details>
<summary>Test analysis</summary>
<p>${escapeHtml(main).replace(/\n/g, "<br>")}</p>
${suggested}
</details>`;
}

function renderFeatures(features: FeatureRecord[]): string {
  if (features.length === 0) {
    return `<section id="features" aria-labelledby="features-h"><h2 id="features-h">Features</h2><p><em>No features mapped yet.</em></p></section>`;
  }
  const rows = features
    .map((feature) => {
      const entry = feature.entrypoints[0]?.path ?? "—";
      return `<tr id="${featureAnchor(feature)}"><td>${escapeHtml(feature.title)}</td><td>${escapeHtml(feature.kind)}</td><td>${escapeHtml(feature.status)}</td><td>${feature.findingIds.length}</td><td><code>${escapeHtml(entry)}</code></td></tr>`;
    })
    .join("\n");
  return `<section id="features" aria-labelledby="features-h">
<h2 id="features-h">Features</h2>
<table>
<thead><tr><th>Title</th><th>Kind</th><th>Status</th><th>Findings</th><th>Entrypoint</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</section>`;
}

function renderPatches(patches: PatchAttempt[]): string {
  if (patches.length === 0) {
    return `<section id="patches" aria-labelledby="patches-h"><h2 id="patches-h">Patches</h2><p><em>No patch attempts recorded.</em></p></section>`;
  }
  const blocks = patches
    .map((patch) => {
      const filesList = patch.filesChanged
        .map((f) => `<li><code>${escapeHtml(f)}</code></li>`)
        .join("\n");
      const commandRows = patch.commandsRun
        .map(
          (c) =>
            `<tr><td><code>${escapeHtml(c.command)}</code></td><td>${c.exitCode ?? "—"}</td><td>${c.durationMs}ms</td></tr>`,
        )
        .join("\n");
      return `<article>
<header><h3><code>${escapeHtml(patch.patchAttemptId)}</code></h3></header>
<dl class="finding-meta">
<dt>Status</dt><dd>${escapeHtml(patch.status)}</dd>
<dt>Findings</dt><dd>${patch.findingIds.length}</dd>
<dt>Files changed</dt><dd>${patch.filesChanged.length}</dd>
${patch.git.prUrl ? `<dt>PR</dt><dd><a href="${escapeHtml(patch.git.prUrl)}">${escapeHtml(patch.git.prUrl)}</a></dd>` : ""}
${patch.git.commitSha ? `<dt>Commit</dt><dd><code>${escapeHtml(patch.git.commitSha)}</code></dd>` : ""}
</dl>
${patch.plan.trim().length > 0 ? `<h4>Plan</h4><p>${escapeHtml(patch.plan)}</p>` : ""}
${
  patch.filesChanged.length > 0
    ? `<details><summary>Files changed (${patch.filesChanged.length})</summary><ul>${filesList}</ul></details>`
    : ""
}
${
  patch.commandsRun.length > 0
    ? `<details><summary>Commands run (${patch.commandsRun.length})</summary><table><thead><tr><th>Command</th><th>Exit</th><th>Duration</th></tr></thead><tbody>${commandRows}</tbody></table></details>`
    : ""
}
</article>`;
    })
    .join("\n");
  return `<section id="patches" aria-labelledby="patches-h">
<h2 id="patches-h">Patches</h2>
${blocks}
</section>`;
}

function renderFooter(): string {
  return `<footer><p><em>Generated by clawpatch-reporter from <code>.clawpatch/</code> state.</em></p></footer>`;
}

function maybeTruncate(text: string, max: number | null): string {
  if (max === null) return text;
  const { text: out, truncated } = truncate(text, max);
  return truncated ? `${out}\n\n(truncated)` : out;
}

function findingAnchor(finding: FindingRecord): string {
  return `fnd-${slugify(finding.findingId)}`;
}

function featureAnchor(feature: FeatureRecord): string {
  return `feat-${slugify(feature.featureId)}`;
}
