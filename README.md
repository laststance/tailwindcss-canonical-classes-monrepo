# Tailwind CSS Canonical Classes

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js >= 18](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)

**Automatically convert non-canonical Tailwind CSS v4 classes to their canonical equivalents.**

Tailwind CSS v4 introduced a design-system-aware class syntax. When you write arbitrary values like `mt-[16px]` but a canonical utility `mt-4` exists in your design system, this toolset rewrites them for you — keeping your codebase consistent and idiomatic.

```diff
- <div class="mt-[16px] text-[red] p-[32px] rounded-[8px]">
+ <div class="mt-4 text-red p-8 rounded-lg">
```

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@laststance/tailwindcss-canonical-core`](packages/core/) | [![npm](https://img.shields.io/npm/v/@laststance/tailwindcss-canonical-core?color=blue)](https://www.npmjs.com/package/@laststance/tailwindcss-canonical-core) | Core transformation logic |
| [`prettier-plugin-tailwindcss-canonical-classes`](packages/prettier-plugin/) | [![npm](https://img.shields.io/npm/v/prettier-plugin-tailwindcss-canonical-classes?color=blue)](https://www.npmjs.com/package/prettier-plugin-tailwindcss-canonical-classes) | Prettier plugin for auto-formatting |
| [`@laststance/tailwind-suggest-canonical-classes`](packages/cli/) | [![npm](https://img.shields.io/npm/v/@laststance/tailwind-suggest-canonical-classes?color=blue)](https://www.npmjs.com/package/@laststance/tailwind-suggest-canonical-classes) | CLI for checking & fixing files |

## Quick Start

### Prettier Plugin (Recommended)

The easiest way to adopt canonical classes — they're applied automatically every time you format.

```bash
npm install -D prettier-plugin-tailwindcss-canonical-classes prettier tailwindcss
```

Add to `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss-canonical-classes"]
}
```

That's it. Run `prettier --write .` and non-canonical classes are rewritten.

#### With prettier-plugin-tailwindcss (class sorting)

This plugin works alongside the official Tailwind CSS Prettier plugin. List the canonical plugin **first** so classes are canonicalized before sorting:

```json
{
  "plugins": [
    "prettier-plugin-tailwindcss-canonical-classes",
    "prettier-plugin-tailwindcss"
  ]
}
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tailwindcssCanonicalStylesheet` | `string` | `undefined` | Path to your Tailwind CSS v4 entry stylesheet |
| `tailwindcssCanonicalRootFontSize` | `int` | `16` | Root font size in px for `rem`-based canonicalization |

```json
{
  "plugins": ["prettier-plugin-tailwindcss-canonical-classes"],
  "tailwindcssCanonicalStylesheet": "./app/globals.css",
  "tailwindcssCanonicalRootFontSize": 16
}
```

### CLI

Check files without modifying them (great for CI):

```bash
npx @laststance/tailwind-suggest-canonical-classes "src/**/*.{tsx,jsx,html}" --check
```

Fix files in place:

```bash
npx @laststance/tailwind-suggest-canonical-classes "src/**/*.{tsx,jsx,html}"
```

#### CLI Options

```
tailwind-suggest-canonical-classes <files/globs> [options]

Options:
  --root <dir>             Project root directory (default: cwd)
  --css <file>             Tailwind v4 entry CSS (default: @import "tailwindcss")
  --root-font-size <num>   Root font size in px (default: 16)
  --check                  Dry run (no writes)
  --dry-run                Alias for --check
  --verbose                Print per-file results
  --help                   Show help
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success — all files processed without errors |
| `1` | Failure — processing errors occurred |

### Core Library

For building custom integrations:

```bash
npm install @laststance/tailwindcss-canonical-core tailwindcss
```

```typescript
import {
  getDesignSystem,
  canonicalizeDocument,
} from '@laststance/tailwindcss-canonical-core'

const designSystem = await getDesignSystem(process.cwd(), './app/globals.css')

const result = await canonicalizeDocument(
  sourceText,
  'component.tsx',
  designSystem,
  process.cwd(),
  { rootFontSize: 16 },
)
```

## How It Works

This toolset leverages Tailwind CSS v4's `__unstable__loadDesignSystem` API to understand your project's design system. The transformation pipeline:

```
Source file
    ↓
Load design system (cached) from your Tailwind v4 config
    ↓
@tailwindcss/language-service validates each class
    → Identifies non-canonical classes via SuggestCanonicalClasses diagnostic
    ↓
designSystem.canonicalizeCandidates() maps to canonical equivalents
    ↓
Text edits applied in reverse order (prevents offset shifting)
    ↓
Canonicalized output
```

Canonical mappings are **not hardcoded** — they come directly from your Tailwind v4 design system. If you've customized your theme, the mappings reflect your configuration.

## Supported File Types

`.astro` · `.css` · `.html` · `.js` · `.jsx` · `.less` · `.md` · `.mdx` · `.scss` · `.svelte` · `.ts` · `.tsx` · `.vue`

## Monorepo Structure

```
packages/
├── core/              # @laststance/tailwindcss-canonical-core
│   └── src/
│       ├── canonicalizer.ts   # Transformation pipeline
│       ├── design-system.ts   # Tailwind v4 design system loader
│       ├── types.ts           # Shared types
│       └── index.ts           # Public API
├── cli/               # @laststance/tailwind-suggest-canonical-classes
│   ├── bin/           # CLI entry point
│   └── src/
│       └── cli.ts     # Argument parsing, file processing, reporting
└── prettier-plugin/   # prettier-plugin-tailwindcss-canonical-classes
    └── src/
        ├── index.ts   # Plugin registration & parser wrapping
        ├── parsers.ts # Parser configuration
        └── options.ts # Prettier option definitions
playground/            # Next.js 16 + shadcn/ui test app
```

## Development

### Prerequisites

- Node.js >= 18
- [pnpm](https://pnpm.io/) 10.x

### Setup

```bash
git clone https://github.com/laststance/tailwindcss-canonical-classes-monrepo.git
cd tailwindcss-canonical-classes-monrepo
pnpm install
```

### Build

```bash
pnpm build          # Build all packages
pnpm typecheck      # Type check all packages
pnpm clean          # Remove dist/ from all packages
```

### Testing with the Playground

The playground is a Next.js 16 + shadcn/ui app for manual testing:

```bash
cd playground
pnpm dev             # Start dev server
pnpm format          # Run Prettier with canonical plugin
pnpm format:check    # Check without modifying
```

> **Note:** Discard playground changes after testing: `git checkout playground/`

## Requirements

- **Tailwind CSS v4** — uses v4's design system API (`__unstable__loadDesignSystem`)
- **Node.js >= 18**
- **Prettier 3.x** (for the Prettier plugin)

## License

[MIT](LICENSE) &copy; [Laststance.io](https://github.com/laststance)
