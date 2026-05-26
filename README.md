# clawpatch-reporter

CLI that renders [clawpatch](https://github.com/openclaw/clawpatch) findings into GitHub-flavored Markdown or semantic HTML reports.

Reads a project's `.clawpatch/` state directory and produces a single human-friendly report per invocation. Markdown is the default. HTML is opt-in via `--format html` and is styled with [new.css](https://newcss.net/).

> Status: early development. Public API and CLI flags may change.

## Quick start

```bash
# Inside a project that already has clawpatch set up:
npx clawpatch-reporter generate
# Writes: .clawpatch/reporter/report.md

npx clawpatch-reporter generate --format html
# Writes: .clawpatch/reporter/report.html
```

## License

MIT
