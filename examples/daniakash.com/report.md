# Clawpatch report: daniakash.com

```yaml
project: daniakash.com
remote: https://github.com/DaniAkash/DaniAkash.git
branch: main
head: 66026de6265218bf23f354b33875ad933791d1f7
generated: 2026-05-26T07:26:51.992Z
features: 16
findings: 8
patches: 1
runs: 3
```

> [!NOTE]
> 7 open findings.

## Contents

- [Summary](#summary)
- [Findings](#findings)
  - 🟠 [Theme changes leave the globe marker and polaroid out of sync](#fnd-fnd-sig-feat-library-c79e5f55d9-5584-db02b323ab)
  - 🟠 [RSS loader trusts newsletter item links as valid URLs](#fnd-fnd-sig-feat-library-f8bf0b65a1-25e6-32053b1a94)
  - 🟠 [writeFileToDist can write outside the build output directory](#fnd-fnd-sig-feat-library-481f66376c-879f-b965fb035b)
  - 🟠 [RSS generation can silently emit invalid feed URLs when Astro site is unset](#fnd-fnd-sig-feat-library-30733ce202-15b1-d92dacd3bb)
  - 🟠 [Globe crashes when given an empty destinations array](#fnd-fnd-sig-feat-library-c79e5f55d9-efe0-8cd087f67c)
  - 🟡 [RSS feed behavior has no regression coverage](#fnd-fnd-sig-feat-library-30733ce202-670c-5830062c73)
  - 🟡 [README documents npm commands despite pnpm package manager](#fnd-fnd-sig-feat-library-f180a663ec-2f87-ba76a6a1c6)
- [Features](#features)
  - [Project config tsconfig.json](#feat-feat-config-0c1c23856a)
  - [Project config package.json](#feat-feat-config-7528cb5b98)
  - [Node source src/constants](#feat-feat-library-126d1a8112)
  - [Node source src/pages](#feat-feat-library-30733ce202)
  - [Node source src/utils](#feat-feat-library-481f66376c)
  - [Node source src/components](#feat-feat-library-c79e5f55d9)
  - [Node package daniakash.com](#feat-feat-library-f180a663ec)
  - [Node source src](#feat-feat-library-f8bf0b65a1)
  - [Package script lint](#feat-feat-release-4862937c51)
  - [Package script build](#feat-feat-release-51170e0f9c)
  - [Package script format](#feat-feat-release-734b842583)
  - [Package script start](#feat-feat-release-775032a0f4)
  - [Package script typecheck](#feat-feat-release-a235aa99b1)
  - [React component AmbientCanvas](#feat-feat-ui-flow-01d1997a91)
  - [React component ThemeToggle](#feat-feat-ui-flow-a5816877de)
  - [React component Globe](#feat-feat-ui-flow-e084b0b622)
- [Patches](#patches)

## Summary

**Total findings:** 7

### By severity

| Severity | Count |
| --- | ---: |
| 🚨 critical | 0 |
| 🔴 high | 0 |
| 🟠 medium | 5 |
| 🟡 low | 2 |

### By status

| Status | Count |
| --- | ---: |
| ◯ open | 7 |
| ? uncertain | 0 |
| ✗ false-positive | 0 |
| ⊘ wont-fix | 0 |
| ✓ fixed | 0 |

### By category

| Category | Count |
| --- | ---: |
| security | 1 |
| bug | 2 |
| api-contract | 2 |
| test-gap | 1 |
| docs-gap | 1 |

## Findings



### 🟠 medium: Theme changes leave the globe marker and polaroid out of sync

<a id="fnd-fnd-sig-feat-library-c79e5f55d9-5584-db02b323ab"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-c79e5f55d9-5584_db02b323ab` |
| Feature | [Node source src/components](#feat-feat-library-c79e5f55d9) |
| Category | bug |
| Confidence | high |
| Triage | confirmed-bug |
| Status | ◯ open |

<details>
<summary>Evidence (2 items)</summary>

- `src/components/Globe.tsx:227-265` `animate`

  ```tsx
  const dest = DESTINATIONS[currentIdxRef.current]!;
  ```
- `src/components/Globe.tsx:282-308` `MutationObserver callback`

  ```tsx
  markers: [{ location: DESTINATIONS[currentIdx]!.loc, size: 0.03 }]
  ```

</details>

**Reasoning**

The initial animation loop updates the cobe phi and also reprojects the polaroid against currentIdxRef on every frame. When the theme class changes, the observer destroys the globe, cancels that loop, creates a new globe with markers from the stale currentIdx captured by the empty-deps effect, and starts animateNew, which only updates phi. After a user navigates away from the initial destination and toggles the theme, the cobe marker can reset to the initial destination while the UI card still shows the selected destination; the polaroid left/top also stop being recomputed, so it no longer tracks the active marker.

**Recommendation**

Factor globe creation and the frame loop through one shared path that always reads currentIdxRef.current for markers and always runs the polaroid projection logic. Avoid using stale currentIdx inside the empty-deps observer callback.

**Minimum fix scope**

src/components/Globe.tsx theme observer and animation loop setup.

**Reproduction**

Render Globe with multiple destinations, click Next so currentIdx differs from the initial random startIdx, then toggle the theme. The recreated cobe globe uses the effect's captured currentIdx for markers and the replacement animation loop no longer runs the polaroid projection block.

<details>
<summary>Test analysis</summary>

No tests are included for Globe interactions or theme mutation behavior.

**Suggested regression test**

Add a component/browser test that advances to a non-initial destination, toggles document.documentElement.classList.dark, and asserts the recreated globe marker update and polaroid positioning use the current destination rather than the initial one.

</details>

### 🟠 medium: RSS loader trusts newsletter item links as valid URLs

<a id="fnd-fnd-sig-feat-library-f8bf0b65a1-25e6-32053b1a94"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-f8bf0b65a1-25e6_32053b1a94` |
| Feature | [Node source src](#feat-feat-library-f8bf0b65a1) |
| Category | bug |
| Confidence | medium |
| Triage | risk |
| Status | ◯ open |

<details>
<summary>Evidence</summary>

- `src/content.config.ts:161-163` `rss.loader`

  ```ts
  const urlObject = new URL(item.link);
        const slug = urlObject.pathname.split("/").filter(Boolean).pop()!;
  ```

</details>

**Reasoning**

The RSS collection loader constructs a URL and non-null slug directly from each external feed item's link. If the upstream newsletter feed contains a missing, relative, malformed, or pathless link, Astro content loading will throw during typecheck/build instead of skipping or reporting a controlled content error. This makes the site build depend on an unchecked external field.

**Recommendation**

Validate item.link before constructing URL and handle empty path segments explicitly, for example by filtering invalid feed items with a clear warning or deriving a fallback id from a stable feed field.

**Minimum fix scope**

Update the rss collection loader in src/content.config.ts to validate link and slug extraction.

<details>
<summary>Test analysis</summary>

No tests are listed for this feature, and the current schema only validates the mapped output after the loader has already parsed item.link.

**Suggested regression test**

Mock the RSS parser to return an item with an invalid or pathless link and assert the loader handles it without an uncaught URL or non-null assertion failure.

</details>

### 🟠 medium: writeFileToDist can write outside the build output directory

<a id="fnd-fnd-sig-feat-library-481f66376c-879f-b965fb035b"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-481f66376c-879f_b965fb035b` |
| Feature | [Node source src/utils](#feat-feat-library-481f66376c) |
| Category | security |
| Confidence | medium |
| Triage | risk |
| Status | ◯ open |

<details>
<summary>Evidence (2 items)</summary>

- `src/utils/writeFileToDist.ts:5-9` `writeFileToDist`

  ```ts
  const imagePath = resolve(process.cwd(), `${targetDir}${filePath}`);
  ```
- `src/utils/getOGImage.ts:15` `getOGImage`

  ```ts
  path: string;
  ```

</details>

**Reasoning**

The destination path is built by string-concatenating the output directory with a caller-controlled path and then resolving it. A value such as `/../../outside.png` becomes `dist/../../outside.png` in production and resolves outside `dist`, so any caller that passes content-derived or otherwise variable paths can overwrite files outside the intended output tree during build/dev generation. getOGImage exposes this as a plain `path: string` parameter and forwards it to the writer without validation.

**Recommendation**

Resolve against a fixed base directory using `resolve(baseDir, relativePathWithoutLeadingSlash)`, then verify the result remains within that base directory before writing. Reject absolute paths and any path containing traversal segments.

**Minimum fix scope**

Constrain and validate `filePath` inside `src/utils/writeFileToDist.ts`; optionally document the accepted path shape at the `getOGImage` call boundary.

**Reproduction**

Call `writeFileToDist('/../../escaped.txt', Buffer.from('x'))` from the project root in production mode; the resolved target is outside `dist`.

<details>
<summary>Test analysis</summary>

No tests are included for this utility group, and there is no regression coverage for path normalization or traversal rejection.

**Suggested regression test**

Add tests for `writeFileToDist` that accept normal paths like `/og/foo.png` but reject `/../foo`, `/../../foo`, absolute filesystem paths, and encoded or mixed traversal variants if those can reach this API.

</details>

### 🟠 medium: RSS generation can silently emit invalid feed URLs when Astro site is unset

<a id="fnd-fnd-sig-feat-library-30733ce202-15b1-d92dacd3bb"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-30733ce202-15b1_d92dacd3bb` |
| Feature | [Node source src/pages](#feat-feat-library-30733ce202) |
| Category | api-contract |
| Confidence | medium |
| Triage | contract-mismatch |
| Status | ◯ open |

<details>
<summary>Evidence (2 items)</summary>

- `src/pages/rss.xml.ts:10-13` `GET`

  ```ts
  return rss({
      title: "Dani Akash’s Blog",
      description:
        "Where my thoughts get some air time (and occasionally make sense).",
      site: context.site ?? "",
  ```
- `package.json:6-8`

  ```json
  "build": "astro check && astro build"
  ```

</details>

**Reasoning**

@astrojs/rss uses the site value as the base for feed links. Falling back to an empty string hides a missing Astro site configuration and can produce an RSS file with non-absolute or malformed channel/item URLs during build instead of failing clearly. Feed consumers commonly require absolute URLs, so this can break subscriptions even when the build command succeeds.

**Recommendation**

Require a configured site before calling rss(), either by removing the empty-string fallback and ensuring Astro config sets site, or by throwing a clear error when context.site is missing.

**Minimum fix scope**

Update src/pages/rss.xml.ts to reject missing context.site or provide a verified canonical site URL.

<details>
<summary>Test analysis</summary>

No linked tests exercise RSS generation with context.site undefined or validate that generated feed links are absolute.

**Suggested regression test**

Add a test or build-time assertion that calls GET with a missing site and verifies it fails with a clear error, plus a positive case that generated item links are absolute when site is configured.

</details>

### 🟠 medium: Globe crashes when given an empty destinations array

<a id="fnd-fnd-sig-feat-library-c79e5f55d9-efe0-8cd087f67c"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-c79e5f55d9-efe0_8cd087f67c` |
| Feature | [Node source src/components](#feat-feat-library-c79e5f55d9) |
| Category | api-contract |
| Confidence | medium |
| Triage | contract-mismatch |
| Status | ◯ open |

<details>
<summary>Evidence (3 items)</summary>

- `src/components/Globe.tsx:100-115` `Globe`

  ```tsx
  destinations: DestinationInput[]
  ```
- `src/components/Globe.tsx:128` `Globe`

  ```tsx
  const d = DESTINATIONS[currentIdx]!;
  ```
- `src/components/Globe.tsx:142-146` `switchTo`

  ```tsx
  ((idx % DESTINATIONS.length) + DESTINATIONS.length) % DESTINATIONS.length
  ```

</details>

**Reasoning**

The prop type allows any array, including an empty one. With zero destinations, startIdx becomes NaN from Math.random() * 0, then the render immediately dereferences DESTINATIONS[startIdx]!.loc and DESTINATIONS[currentIdx]!, causing a runtime crash. Navigation also performs modulo by DESTINATIONS.length, which is zero. If this component is fed from content or data that can be temporarily empty, the page fails instead of rendering an empty state.

**Recommendation**

Either enforce a non-empty tuple type at the component boundary and validate callers, or add an early empty-state return before computing startIdx/current destination and disable cycling/navigation when there are no destinations.

**Minimum fix scope**

src/components/Globe.tsx initialization and render guard for DESTINATIONS.length === 0.

**Reproduction**

Render <Globe destinations={[]} />. The component computes startIdx as NaN and then attempts to read DESTINATIONS[startIdx]!.loc during render.

<details>
<summary>Test analysis</summary>

No tests are included for the Globe prop contract or empty data states.

**Suggested regression test**

Add a render test for <Globe destinations={[]} /> that expects a stable empty state and no thrown exception.

</details>

### 🟡 low: RSS feed behavior has no regression coverage

<a id="fnd-fnd-sig-feat-library-30733ce202-670c-5830062c73"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-30733ce202-670c_5830062c73` |
| Feature | [Node source src/pages](#feat-feat-library-30733ce202) |
| Category | test-gap |
| Confidence | high |
| Triage | test-gap |
| Status | ◯ open |

<details>
<summary>Evidence (2 items)</summary>

- `package.json:6-15`

  ```json
  "scripts": {
      "dev": "astro dev",
      "start": "astro dev",
      "build": "astro check && astro build",
      "preview": "astro preview",
      "astro": "astro",
      "typecheck": "astro check",
      "lint": "biome check .",
      "lint:fix": "biome check --fix .",
      "format": "biome format --write .",
      "clawpatch": "clawpatch"
    }
  ```
- `src/pages/rss.xml.ts:14-31` `GET`

  ```ts
  items: [
        ...blog.map((post) => {
          return {
            title: post.data.title,
            pubDate: new Date(post.data.date),
            description: post.data.subtitle,
            link: `/posts/${post.id}`,
            content: sanitizeHtml(parser.render(post.body ?? ""), {
              allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
            }),
          };
        }),
  ```

</details>

**Reasoning**

The route combines two content collections, renders Markdown to HTML, sanitizes feed content, constructs public links, and sorts by publication date, but the project exposes no test command and no linked tests were provided. Regressions in ordering, URL generation, invalid dates, or sanitization policy would currently be caught only by manual inspection or downstream feed-reader failures.

**Recommendation**

Add focused coverage for RSS item generation: ordering across blog/news entries, absolute link output, expected sanitization of unsafe HTML, and handling of invalid or missing dates.

**Minimum fix scope**

Add a test harness or route-level test for src/pages/rss.xml.ts and expose it through a package script if the project standardizes on a test runner.

<details>
<summary>Test analysis</summary>

The feature metadata lists no tests, and package.json has typecheck/lint/build scripts but no test script.

**Suggested regression test**

Create an RSS route test with mocked getCollection data for both collections and assert stable sorted output, sanitized content, and valid feed URLs.

</details>

### 🟡 low: README documents npm commands despite pnpm package manager

<a id="fnd-fnd-sig-feat-library-f180a663ec-2f87-ba76a6a1c6"></a>

| Field | Value |
| --- | --- |
| ID | `fnd_sig-feat-library-f180a663ec-2f87_ba76a6a1c6` |
| Feature | [Node package daniakash.com](#feat-feat-library-f180a663ec) |
| Category | docs-gap |
| Confidence | high |
| Triage | docs-gap |
| Status | ◯ open |

<details>
<summary>Evidence (2 items)</summary>

- `package.json:5`

  ```json
  "packageManager": "pnpm@10.33.0"
  ```
- `README.md:31-39`

  ```markdown
  The commands table uses npm install and npm run commands.
  ```

</details>

**Reasoning**

The package manifest explicitly pins pnpm, but the package context tells contributors to install and run the project with npm. Following the README can create an npm lockfile, ignore pnpm-specific lock resolution, and make local or CI dependency behavior diverge from the intended package manager.

**Recommendation**

Update README commands to use `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm preview`, and `pnpm astro ...`, or remove the starter README if it is no longer authoritative.

**Minimum fix scope**

README.md command table and any setup snippets that mention npm.

**Reproduction**

Follow README.md: run `npm install` and `npm run build` in a fresh checkout instead of using the pinned `pnpm` workflow.

<details>
<summary>Test analysis</summary>

No tests or documentation checks are linked for this feature, and the package scripts do not validate README command accuracy.

</details>

## Features

| Title | Kind | Status | Findings | Entrypoint |
| --- | --- | --- | ---: | --- |
| <a id="feat-feat-config-0c1c23856a"></a>Project config tsconfig.json | config | reviewed | 0 | `tsconfig.json` |
| <a id="feat-feat-config-7528cb5b98"></a>Project config package.json | config | reviewed | 0 | `package.json` |
| <a id="feat-feat-library-126d1a8112"></a>Node source src/constants | library | reviewed | 0 | `package.json` |
| <a id="feat-feat-library-30733ce202"></a>Node source src/pages | library | needs-fix | 2 | `package.json` |
| <a id="feat-feat-library-481f66376c"></a>Node source src/utils | library | needs-fix | 1 | `package.json` |
| <a id="feat-feat-library-c79e5f55d9"></a>Node source src/components | library | needs-fix | 2 | `package.json` |
| <a id="feat-feat-library-f180a663ec"></a>Node package daniakash.com | library | needs-fix | 2 | `package.json` |
| <a id="feat-feat-library-f8bf0b65a1"></a>Node source src | library | needs-fix | 1 | `package.json` |
| <a id="feat-feat-release-4862937c51"></a>Package script lint | release | reviewed | 0 | `package.json` |
| <a id="feat-feat-release-51170e0f9c"></a>Package script build | release | reviewed | 0 | `package.json` |
| <a id="feat-feat-release-734b842583"></a>Package script format | release | reviewed | 0 | `package.json` |
| <a id="feat-feat-release-775032a0f4"></a>Package script start | release | pending | 0 | `package.json` |
| <a id="feat-feat-release-a235aa99b1"></a>Package script typecheck | release | pending | 0 | `package.json` |
| <a id="feat-feat-ui-flow-01d1997a91"></a>React component AmbientCanvas | ui-flow | pending | 0 | `src/components/AmbientCanvas.tsx` |
| <a id="feat-feat-ui-flow-a5816877de"></a>React component ThemeToggle | ui-flow | pending | 0 | `src/components/ThemeToggle.tsx` |
| <a id="feat-feat-ui-flow-e084b0b622"></a>React component Globe | ui-flow | pending | 0 | `src/components/Globe.tsx` |

## Patches

### `pat_fnd-sig-feat-library-f180a663ec-_6582ed80f7`

- **Status:** applied
- **Findings:** 1
- **Files changed:** 18

**Plan**

Added `"private": true` to the top-level package manifest so the Astro website package is not publishable by npm tooling.

<details>
<summary>Files changed (18)</summary>

- `daniakash.com/.clawpatch/config.json`
- `daniakash.com/.clawpatch/features/feat_config_0c1c23856a.json`
- `daniakash.com/.clawpatch/features/feat_config_7528cb5b98.json`
- `daniakash.com/.clawpatch/features/feat_library_481f66376c.json`
- `daniakash.com/.clawpatch/features/feat_library_f180a663ec.json`
- `daniakash.com/.clawpatch/features/feat_library_f8bf0b65a1.json`
- `daniakash.com/.clawpatch/features/feat_release_4862937c51.json`
- `daniakash.com/.clawpatch/features/feat_release_51170e0f9c.json`
- `daniakash.com/.clawpatch/features/feat_release_734b842583.json`
- `daniakash.com/.clawpatch/features/feat_release_775032a0f4.json`
- `daniakash.com/.clawpatch/features/feat_release_a235aa99b1.json`
- `daniakash.com/.clawpatch/features/feat_ui-flow_01d1997a91.json`
- `daniakash.com/.clawpatch/features/feat_ui-flow_a5816877de.json`
- `daniakash.com/.clawpatch/features/feat_ui-flow_e084b0b622.json`
- `daniakash.com/.clawpatch/project.json`
- `daniakash.com/.clawpatch/runs/20260517T104148-ff577f.json`
- `daniakash.com/.clawpatch/runs/20260517T104513-6d9f59.json`
- `daniakash.com/package.json`

</details>

<details>
<summary>Commands run (3)</summary>

| Command | Exit | Duration |
| --- | ---: | ---: |
| `pnpm format` | 0 | 249ms |
| `pnpm typecheck` | 0 | 6856ms |
| `pnpm lint` | 0 | 234ms |

</details>


---

_Generated by clawpatch-reporter from `.clawpatch/` state._
