# clawpatch-reporter

CLI that renders [clawpatch](https://github.com/openclaw/clawpatch) findings into GitHub-flavored Markdown or semantic HTML reports.

Reads a project's `.clawpatch/` state directory and produces a single human-friendly report per invocation. Markdown is the default. HTML is opt-in via `--format html` and is styled with [new.css](https://newcss.net/).

> Status: early development. Public API and CLI flags may change.

## Install

```bash
# Global
npm install -g clawpatch-reporter

# Or one-off via npx / pnpm dlx / bunx
npx clawpatch-reporter --help
```

Requires Node.js 22 or later.

## Quick start

```bash
# Inside a project that already has clawpatch set up:
clawpatch-reporter generate
# Writes: .clawpatch/reporter/report.md

clawpatch-reporter generate --format html
# Writes: .clawpatch/reporter/report.html

# Stream to stdout instead of disk
clawpatch-reporter generate --stdout --format md > report.md
```

## What you get

Each report includes:

- a YAML metadata block with project name, git remote, branch, head SHA, generation time, and feature/finding/patch/run counts
- a severity callout banner that adapts to the worst open severity in the report (caution, warning, note, or tip)
- an anchored table of contents
- summary tables: counts by severity, by status, and by category
- per-finding sections sorted by severity and confidence, with metadata, collapsible evidence, reasoning, recommendation, minimum fix scope, reproduction, and test analysis
- a features table that links from each finding back to its parent feature
- per-patch details with status, files changed, and validation command results

The HTML version uses real semantic elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<details>`, `<dl>`) and links new.css from CDN plus a small block of scoped CSS for severity and status pills, responsive summary grid, and light/dark callouts.

## Commands

| Command | What it renders |
| --- | --- |
| `generate` (default) | Summary, findings, features, and patches |
| `findings` | Findings section only |
| `features` | Features section only |
| `summary` | Summary counts only |

## Flags

| Flag | Default | Notes |
| --- | --- | --- |
| `--root <path>` | cwd | Project root containing `.clawpatch/` |
| `--state-dir <path>` | `<root>/.clawpatch` | Override the state directory directly |
| `--format <fmt>` | `md` | `md` or `html` |
| `--output <path>` | `.clawpatch/reporter/report.<ext>` | File path; must match `--format` extension if given |
| `--stdout` | off | Write to stdout instead of disk |
| `--status <status>` | | Repeatable. Including any value also includes fixed findings. |
| `--severity <severity>` | | Repeatable. `critical`, `high`, `medium`, `low`. |
| `--category <category>` | | Repeatable. Matches clawpatch finding categories. |
| `--triage <triage>` | | Repeatable. |
| `--feature <id>` | | Limit findings to one feature ID. |
| `--include-fixed` | off | Show findings whose status is `fixed`. |
| `--no-toc` | off | Omit the table of contents. |
| `--max-evidence <n>` | `8` | Cap evidence entries shown per finding. |
| `--quiet` | off | Suppress progress chatter. |

Filter flags compose as AND across keys, OR within a single key. Reading `--severity high --severity critical` matches either severity, then intersects with whatever the other flags select.

## Output location

By default the report lands inside the project's own state directory: `.clawpatch/reporter/report.md` (or `.html`). This keeps the rendered artifact next to its source data and is automatically excluded from future `clawpatch map` and `clawpatch review` runs by the default `exclude: [".clawpatch/**"]` in `config.json`. A dedicated `reporter/` subdirectory avoids any collision with `.clawpatch/reports/<runId>.md`, which is owned by clawpatch itself.

## How it works

`clawpatch-reporter` reads the on-disk JSON records that `clawpatch` writes: `project.json`, `config.json`, and per-record files under `features/`, `findings/`, `patches/`, and `runs/`. Each record is validated against a zod schema that mirrors clawpatch's own `schemaVersion: 1` shape. Unknown fields are tolerated; missing optional fields are defaulted; a schema version mismatch fails loudly so the reporter never silently misreads upstream changes.

This means the tool stays decoupled from clawpatch. There is no clawpatch dependency, no shelling out to the `clawpatch` binary, and no upstream PR required to install it.

## Development

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run build
```

Tests use a real `.clawpatch/` fixture under `test/fixtures/daniakash-com/` so every renderer change shows up as a snapshot diff.

## License

MIT
