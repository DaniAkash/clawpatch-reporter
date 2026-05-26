import type { EvidenceRef } from "../../schemas/finding.js";

export function evidenceRange(evidence: EvidenceRef): string | null {
  if (evidence.startLine === null) {
    return null;
  }
  if (evidence.endLine === null || evidence.endLine === evidence.startLine) {
    return String(evidence.startLine);
  }
  return `${evidence.startLine}-${evidence.endLine}`;
}

export function evidenceLocation(evidence: EvidenceRef): string {
  const range = evidenceRange(evidence);
  return range ? `${evidence.path}:${range}` : evidence.path;
}

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  mjs: "js",
  cjs: "js",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  swift: "swift",
  cs: "csharp",
  fs: "fsharp",
  vb: "vbnet",
  php: "php",
  ex: "elixir",
  exs: "elixir",
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  hpp: "cpp",
  m: "objectivec",
  mm: "objectivec",
  scala: "scala",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  ps1: "powershell",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sql: "sql",
  md: "markdown",
  mdx: "mdx",
  astro: "astro",
  vue: "vue",
  svelte: "svelte",
};

export function languageForPath(path: string): string {
  const dot = path.lastIndexOf(".");
  if (dot === -1) {
    return "";
  }
  const ext = path.slice(dot + 1).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? "";
}
