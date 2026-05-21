## Project Overview

Monorepo for Tailwind CSS v4 canonical class transformation tools. Converts non-canonical classes to canonical equivalents (e.g., `mt-[16px]` → `mt-4`).

## Monorepo Structure

```
packages/
├── core/             # @laststance/tailwindcss-canonical-classes-core - Shared logic
├── cli/              # @laststance/tailwind-suggest-canonical-classes - CLI tool
└── prettier-plugin/  # prettier-plugin-tailwindcss-canonical-classes
playground/           # Next.js 16 + shadcn/ui test app
```

## Commands

```bash
pnpm build        # Build all packages
pnpm typecheck    # Type check all packages
```

### CLI Usage

```bash
# After npm install
tailwind-suggest-canonical-classes "src/**/*.{tsx,jsx,html}" --check

# Local development
cd packages/cli
node dist/cli.js "../../playground/**/*.tsx" --check --verbose
```

### Prettier Plugin Usage

```json
// .prettierrc
{
  "plugins": ["prettier-plugin-tailwindcss-canonical-classes"],
  "tailwindcssCanonicalStylesheet": "./app/globals.css"
}
```

## Playground

shadcn/uiコンポーネントを含むNext.js 16 + Tailwind v4テストプロジェクト。
CLI・Prettierプラグインの動作確認用。

```bash
cd playground
pnpm dev              # Start dev server
pnpm format           # Run Prettier with canonical plugin
pnpm format:check     # Check formatting
```

⚠️ **重要**: テスト後はplaygroundの変更を必ず破棄する

```bash
git checkout playground/
```

## Architecture

### Core Package (`packages/core`)

- `design-system.ts`: Loads Tailwind v4 via `__unstable__loadDesignSystem`
- `canonicalizer.ts`: `doValidate` → `buildCanonicalEdits` → `applyTextEdits`

### CLI Package (`packages/cli`)

- `bin/tailwind-suggest-canonical.js`: Entry point (shebang)
- `src/cli.ts`: Argument parsing (minimist), glob resolution (tinyglobby), file processing, reporting

### Prettier Plugin (`packages/prettier-plugin`)

Extends Prettier's built-in parsers with `preprocess` hook that calls core's `canonicalizeDocument`.

### Supported File Types

`.astro`, `.css`, `.html`, `.js`, `.jsx`, `.md`, `.mdx`, `.ts`, `.tsx`, `.vue`, `.svelte`

## npm Publishing

⚠️ **MUST use `pnpm publish`** (not `npm publish`) — `workspace:*` protocol needs pnpm to resolve.

```bash
cd packages/<package>
pnpm publish
```

| Package         | npm Name                                         | Scoped                               |
| --------------- | ------------------------------------------------ | ------------------------------------ |
| core            | `@laststance/tailwindcss-canonical-classes-core` | Yes (`publishConfig.access: public`) |
| cli             | `@laststance/tailwind-suggest-canonical-classes` | Yes (`publishConfig.access: public`) |
| prettier-plugin | `prettier-plugin-tailwindcss-canonical-classes`  | No                                   |

### Release Workflow

GitHub Actions release is configured in `.github/workflows/release.yml`.

Requirements:

- npm Trusted Publisher must be configured for each package.
- Trusted Publisher repository must be `laststance/tailwindcss-canonical-classes-monrepo`.
- Environment name should be empty unless `.github/workflows/release.yml` is updated to use a matching GitHub Actions environment.
- Workflow permissions must include `contents: write` and `id-token: write`.
- Release uses OIDC Trusted Publishing. Do not add `NODE_AUTH_TOKEN` or `NPM_TOKEN` for publish.

Release commit message controls which package is published:

```bash
release core@0.1.1
release cli@0.1.2
release prettier-plugin@0.1.5
```

Standard release steps:

```bash
# 1. Bump only the target package version.
$EDITOR packages/<package>/package.json

# 2. Verify package checks. Build core first because dependent packages read core's dist types.
pnpm --filter @laststance/tailwindcss-canonical-classes-core typecheck
pnpm --filter @laststance/tailwindcss-canonical-classes-core build
pnpm --filter @laststance/tailwind-suggest-canonical-classes typecheck
pnpm --filter prettier-plugin-tailwindcss-canonical-classes typecheck

# 3. Commit with the release trigger message and push.
git add packages/<package>/package.json
git commit -m "release prettier-plugin@0.1.5"
git push origin main
```

After push, watch the Release workflow:

```bash
gh run list --workflow Release --limit 5
gh run watch <run-id> --exit-status
```

Verify npm, tag, and GitHub Release:

```bash
pnpm view prettier-plugin-tailwindcss-canonical-classes version dist-tags.latest --json
git ls-remote --tags origin 'prettier-plugin@0.1.5'
gh release view prettier-plugin@0.1.5 --json tagName,url,name,isDraft,isPrerelease
```

### Release Troubleshooting

- If publish fails with `404 ... do not have permission`, check npm Trusted Publisher first.
- If `main` advanced after a failed release commit, prefer creating a new empty release-trigger commit on latest `main` instead of rerunning the old failed workflow:

```bash
git commit --allow-empty -m "release prettier-plugin@0.1.5"
git push origin main
```

- If npm publish succeeds but release-it fails later while pushing the tag/release, manually reconcile GitHub metadata:

```bash
git tag prettier-plugin@0.1.5 <commit-sha>
git push origin prettier-plugin@0.1.5
gh release create prettier-plugin@0.1.5 \
  --title "prettier-plugin-tailwindcss-canonical-classes v0.1.5" \
  --notes "$(git log --no-merges --pretty=format:'* %s %h' prettier-plugin@0.1.4..prettier-plugin@0.1.5)"
```

### CI Notes

CI intentionally checks/builds `packages/*` rather than the playground. The playground is for manual verification and may have framework or shadcn/ui type drift unrelated to package publishing.

For clean installs, build `@laststance/tailwindcss-canonical-classes-core` before typechecking or building dependent packages. The CLI and Prettier plugin resolve core through workspace links and need core's `dist` declarations.
