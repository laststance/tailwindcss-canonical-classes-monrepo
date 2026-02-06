# @laststance/tailwind-suggest-canonical-classes

A CLI that converts non-canonical Tailwind CSS v4 classes to their canonical equivalents.

For example, `mt-[16px]` becomes `mt-4`, `text-[red]` becomes `text-red`, and other arbitrary value classes are replaced with their design-system-native counterparts.

## Installation

```sh
npm install -g @laststance/tailwind-suggest-canonical-classes tailwindcss
```

Or as a dev dependency:

```sh
npm install -D @laststance/tailwind-suggest-canonical-classes tailwindcss
```

## Usage

```sh
# Fix files in place
tailwind-suggest-canonical-classes "src/**/*.{tsx,jsx,html}"

# Dry run (no writes)
tailwind-suggest-canonical-classes "src/**/*.tsx" --check

# Verbose output
tailwind-suggest-canonical-classes "src/**/*.tsx" --verbose
```

## Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--root <dir>` | | `cwd` | Project root directory |
| `--css <file>` | | `@import "tailwindcss"` | Tailwind v4 entry CSS file path |
| `--root-font-size <num>` | | `16` | Root font size in px for rem-based canonicalization |
| `--check` | | | Dry run mode (no file writes) |
| `--dry-run` | | | Alias for `--check` |
| `--verbose` | `-v` | | Print per-file results |
| `--help` | `-h` | | Show help |

## Examples

```sh
# Canonicalize all TSX files
tailwind-suggest-canonical-classes "src/**/*.tsx"

# Check Svelte files without modifying
tailwind-suggest-canonical-classes "**/*.svelte" --check

# Specify a custom CSS entry point
tailwind-suggest-canonical-classes "src/**/*.tsx" --css ./app/globals.css

# Use a custom root font size
tailwind-suggest-canonical-classes "src/**/*.tsx" --root-font-size 14
```

## Supported File Types

`.astro`, `.css`, `.html`, `.js`, `.jsx`, `.md`, `.mdx`, `.svelte`, `.ts`, `.tsx`, `.vue`

## Requirements

- Tailwind CSS v4
- Node.js >= 18

## Related

- [`prettier-plugin-tailwindcss-canonical-classes`](https://www.npmjs.com/package/prettier-plugin-tailwindcss-canonical-classes) - Prettier plugin for automatic canonicalization on format
- [`@laststance/tailwindcss-canonical-core`](https://www.npmjs.com/package/@laststance/tailwindcss-canonical-core) - Core transformation logic

## License

MIT
