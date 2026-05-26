import { describe, expect, it } from "vitest";
import { renderHtml } from "../src/render/html.js";
import { loadFixture } from "./helpers.js";

describe("renderHtml", () => {
  it("renders the full daniakash.com fixture report", async () => {
    const report = await loadFixture();
    const html = renderHtml(report, report.findings, { generatedAt: report.loadedAt });
    expect(html).toMatchSnapshot();
  });

  it("starts with a doctype and links new.css", async () => {
    const report = await loadFixture();
    const html = renderHtml(report, report.findings, { generatedAt: report.loadedAt });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("newcss.net/new.min.css");
  });

  it("tags each finding article with severity and status data attributes", async () => {
    const report = await loadFixture();
    const html = renderHtml(report, report.findings, { generatedAt: report.loadedAt });
    for (const finding of report.findings) {
      expect(html).toContain(
        `data-severity="${finding.severity}" data-status="${finding.status}"`,
      );
    }
  });
});
