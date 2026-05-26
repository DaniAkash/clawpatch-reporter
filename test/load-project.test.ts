import { describe, expect, it } from "vitest";
import { loadFixture } from "./helpers.js";

describe("loadProject", () => {
  it("loads the daniakash.com fixture cleanly", async () => {
    const report = await loadFixture();
    expect(report.project.name).toBe("daniakash.com");
    expect(report.features).toHaveLength(16);
    expect(report.findings).toHaveLength(8);
    expect(report.patches).toHaveLength(1);
    expect(report.runs).toHaveLength(3);
    expect(report.availableReportFiles.length).toBeGreaterThanOrEqual(2);
  });

  it("populates derived finding fields", async () => {
    const report = await loadFixture();
    for (const finding of report.findings) {
      expect(finding.triage).toBeTruthy();
      expect(typeof finding.minimumFixScope).toBe("string");
      expect(Array.isArray(finding.history)).toBe(true);
    }
  });
});
