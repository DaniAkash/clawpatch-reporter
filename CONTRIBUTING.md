# Contributing to clawpatch-reporter

Thanks for your interest. The package is pre-1.0, so the most useful contributions right now are bug reports, real-world usage notes, and PRs that improve the renderers against tricky real `.clawpatch/` state.

## Quick start

Requires [Bun](https://bun.sh) (version pinned in [`.bun-version`](./.bun-version)). Node is not required to develop. The published artifact runs on Node 22+.

```bash
git clone https://github.com/DaniAkash/clawpatch-reporter
cd clawpatch-reporter
bun install

bun run typecheck
bun run lint
bun run test
bun run build
```

All four must be green before opening a PR. CI runs the same checks as a final gate.

## Project layout

```
clawpatch-reporter/
├── src/
│   ├── cli.ts             Commander CLI entry point
│   ├── index.ts           Library entry point (renderers + loader)
│   ├── commands/          Per-command runners (generate, etc.)
│   ├── load/              .clawpatch/ -> ProjectReport loader
│   ├── render/            Markdown + HTML renderers
│   ├── schemas/           zod schemas mirroring clawpatch records
│   ├── select/            Filter + sort helpers
│   └── util/              Small helpers (escape-html, slugify, ...)
├── test/                  vitest snapshot + unit tests
│   └── fixtures/          Real .clawpatch/ snapshots used by tests
├── examples/              Rendered example reports per project
├── bunup.config.ts        Build config (ESM, dts, externals)
├── cliff.toml             git-cliff changelog config
└── .github/workflows/     CI + release pipelines
```

## Commit style

Conventional Commits. `git-cliff` parses the history between two tags to render release notes per [`cliff.toml`](./cliff.toml), and unconventional commits are filtered out so they never appear in changelogs. Use one of:

`feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `chore`, `ci`, `revert`. `chore(release): ...` and `chore(deps): ...` get their own treatment.

## Releasing to npm

The release workflow ([`.github/workflows/release.yml`](./.github/workflows/release.yml)) publishes to npm and drafts a GitHub Release whenever a `v*` tag is pushed.

### One-time setup

- Add `NPM_TOKEN` (automation token from npmjs.com with publish access) under Settings -> Secrets and variables -> Actions
- Settings -> Actions -> General -> Workflow permissions -> "Read and write permissions" (required for the `id-token: write` permission that signs the provenance attestation)

### Release steps

1. Bump `version` in `package.json`
2. Commit: `git commit -m "chore(release): X.Y.Z"`. The `chore(release)` prefix is filtered out of the next changelog so the bump commit does not show up there
3. Tag and push:

   ```bash
   git tag vX.Y.Z
   git push origin main --tags
   ```

4. Watch the release workflow run. On success it will:

   - re-run lint + typecheck + tests + build
   - run `npm publish --access public --provenance`
   - render the changelog from conventional commits since the previous tag
   - create a **draft** GitHub Release with the changelog body

5. Open the draft from the Releases page, eyeball it, and click Publish

### First release

`v0.0.1` is the first tag. There is no previous tag to diff against, so the changelog step is skipped and the draft Release body is the literal text `first release`. Subsequent releases get a rendered changelog.

### Patch / minor / major

Follow [semver](https://semver.org/). Pre-1.0 the rules are looser, but stay close: bump the patch for fixes, the minor for additions, the major for breaking changes.

## License

MIT
