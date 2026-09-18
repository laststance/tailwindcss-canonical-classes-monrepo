# prettier-plugin-tailwindcss-canonical-classes

A Prettier plugin that automatically converts non-canonical Tailwind CSS v4 classes to their canonical equivalents.

For example, `mt-[16px]` becomes `mt-4`, `text-[red]` becomes `text-red`, and other arbitrary value classes are replaced with their design-system-native counterparts.

## Installation

```sh
npm install -D prettier-plugin-tailwindcss-canonical-classes prettier tailwindcss
```

## Configuration

Add the plugin to your `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss-canonical-classes"]
}
```

### With prettier-plugin-tailwindcss (class sorting)

> **VS Code extension note:** Relative `tailwindcssCanonicalStylesheet` paths
> are resolved from the Prettier configuration file, matching
> `prettier-plugin-tailwindcss`. For nested packages, keep the Prettier config
> next to the stylesheet owner or use an absolute stylesheet path.

Install both Prettier plugins:

```sh
npm install -D prettier prettier-plugin-tailwindcss prettier-plugin-tailwindcss-canonical-classes tailwindcss
```

List `prettier-plugin-tailwindcss-canonical-classes` **last** so it can canonicalize classes before delegating to the sorting plugin's preprocessing and AST parsing:

```json
{
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-tailwindcss-canonical-classes"
  ],
  "tailwindStylesheet": "./app/globals.css",
  "tailwindcssCanonicalStylesheet": "./app/globals.css"
}
```

Both stylesheet options should point to the same Tailwind v4 entry file. Sorting options such as `tailwindFunctions` are forwarded to `prettier-plugin-tailwindcss`. A single format pass applies both transformations.

Run Prettier from the command line:

```sh
# Check formatting without modifying files
npx prettier --check "src/**/*.{astro,css,html,js,jsx,md,mdx,ts,tsx,vue,svelte}"

# Format files in place
npx prettier --write "src/**/*.{astro,css,html,js,jsx,md,mdx,ts,tsx,vue,svelte}"
```

To apply canonicalization without Prettier, run the CLI powered by `@laststance/tailwindcss-canonical-classes-core` directly:

```sh
# Check files without modifying them
npx -y @laststance/tailwind-suggest-canonical-classes@latest "src/**/*.{tsx,jsx,html}" --check

# Fix files in place
npx -y @laststance/tailwind-suggest-canonical-classes@latest "src/**/*.{tsx,jsx,html}"
```

If your Tailwind v4 entry stylesheet is not discoverable automatically, pass it explicitly:

```sh
npx -y @laststance/tailwind-suggest-canonical-classes@latest "src/**/*.{tsx,jsx,html}" --css ./app/globals.css
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tailwindcssCanonicalStylesheet` | `string` | `undefined` | Path to your Tailwind CSS v4 entry stylesheet (relative to the Prettier configuration file). If omitted, the plugin uses `@import "tailwindcss"` internally. |
| `tailwindcssCanonicalRootFontSize` | `int` | `16` | Root font size in pixels, used for `rem`-based canonicalization. |

### Example with options

```json
{
  "plugins": ["prettier-plugin-tailwindcss-canonical-classes"],
  "tailwindcssCanonicalStylesheet": "./app/globals.css",
  "tailwindcssCanonicalRootFontSize": 16
}
```

## Supported File Types

`.astro`, `.css`, `.html`, `.js`, `.jsx`, `.less`, `.mdx`, `.scss`, `.svelte`, `.ts`, `.tsx`, `.vue`

## Requirements

When combining with `prettier-plugin-tailwindcss`, also satisfy its runtime requirements; version 0.8.1 requires Node.js >= 20.19.

- Prettier >= 3.7.0 and < 4 (async parser preprocessing requires 3.7.0)
- Tailwind CSS v4
- Node.js >= 18

## License

MIT
