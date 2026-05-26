import { describe, expect, it } from "vitest";
import { filterFindings } from "../src/select/filter.js";
import { loadFixture } from "./helpers.js";

describe("filterFindings", () => {
  it("hides fixed findings by default", async () => {
    const report = await loadFixture();
    const filtered = filterFindings(report.findings, {});
    expect(filtered.every((f) => f.status !== "fixed")).toBe(true);
    expect(filtered.length).toBeLessThan(report.findings.length);
  });

  it("respects explicit --status filter", async () => {
    const report = await loadFixture();
    const filtered = filterFindings(report.findings, { statuses: ["fixed"] });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.status).toBe("fixed");
  });

  it("treats severity filter as OR within the key", async () => {
    const report = await loadFixture();
    const filtered = filterFindings(report.findings, { severities: ["medium", "low"] });
    expect(filtered.every((f) => f.severity === "medium" || f.severity === "low")).toBe(true);
  });

  it("ANDs across keys", async () => {
    const report = await loadFixture();
    const filtered = filterFindings(report.findings, {
      severities: ["medium"],
      categories: ["api-contract"],
    });
    expect(filtered.every((f) => f.severity === "medium" && f.category === "api-contract")).toBe(
      true,
    );
  });
});
