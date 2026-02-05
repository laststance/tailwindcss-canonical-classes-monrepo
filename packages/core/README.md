# @laststance/tailwindcss-canonical-core

Core logic for transforming non-canonical Tailwind CSS v4 classes into their canonical equivalents. This package powers [`prettier-plugin-tailwindcss-canonical-classes`](https://www.npmjs.com/package/prettier-plugin-tailwindcss-canonical-classes) and the `tailwind-suggest-canonical-classes` CLI.

## Installation

```sh
npm install @laststance/tailwindcss-canonical-core tailwindcss
```

## Usage

```ts
import {
  getDesignSystem,
  canonicalizeDocument,
} from '@laststance/tailwindcss-canonical-core'

// Load the Tailwind v4 design system
const designSystem = await getDesignSystem(process.cwd(), './app/globals.css')

// Canonicalize classes in a source file
const result = await canonicalizeDocument(
  sourceText,
  'component.tsx',
  designSystem,
  process.cwd(),
  { rootFontSize: 16 },
)
```

## API

### `getDesignSystem(rootDir, cssPath?)`

Loads and caches the Tailwind CSS v4 design system from the project root.

### `canonicalizeDocument(text, filePath, designSystem, rootDir, options?)`

Transforms all non-canonical Tailwind classes in the given source text to their canonical forms.

### `inferLanguageId(filePath)`

Returns the language identifier for a file path, or `undefined` if unsupported.

### `isSupportedExtension(filePath)`

Returns `true` if the file extension is supported for canonicalization.

## Supported File Types

`.astro`, `.css`, `.html`, `.js`, `.jsx`, `.less`, `.md`, `.mdx`, `.scss`, `.svelte`, `.ts`, `.tsx`, `.vue`

## Requirements

- Tailwind CSS v4
- Node.js >= 18

## License

MIT
