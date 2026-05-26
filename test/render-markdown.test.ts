import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/render/markdown.js";
import { loadFixture } from "./helpers.js";

describe("renderMarkdown", () => {
  it("renders the full daniakash.com fixture report", async () => {
    const report = await loadFixture();
    const md = renderMarkdown(report, report.findings, { generatedAt: report.loadedAt });
    expect(md).toMatchSnapshot();
  });

  it("renders an empty-findings state", async () => {
    const report = await loadFixture();
    const md = renderMarkdown(report, [], { generatedAt: report.loadedAt });
    expect(md).toContain("_No findings match the current filters._");
  });

  it("omits the table of contents when --no-toc is used", async () => {
    const report = await loadFixture();
    const md = renderMarkdown(report, report.findings, {
      generatedAt: report.loadedAt,
      includeToc: false,
    });
    expect(md).not.toContain("## Contents");
  });
});
