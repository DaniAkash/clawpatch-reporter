export type Section = "summary" | "findings" | "features" | "patches";

export type RenderOptions = {
  sections?: Section[];
  includeToc?: boolean;
  maxEvidence?: number;
  truncateReasoning?: number | null;
  generatedAt?: string;
};

export const DEFAULT_RENDER_OPTIONS = {
  sections: ["summary", "findings", "features", "patches"] as Section[],
  includeToc: true,
  maxEvidence: 8,
  truncateReasoning: 4000 as number | null,
};
