# prettier-plugin-tailwindcss-canonical

A Prettier plugin that automatically converts non-canonical Tailwind CSS v4 classes to their canonical equivalents.

For example, `mt-[16px]` becomes `mt-4`, `text-[red]` becomes `text-red`, and other arbitrary value classes are replaced with their design-system-native counterparts.

## Installation

```sh
npm install -D prettier-plugin-tailwindcss-canonical prettier tailwindcss
```

## Configuration

Add the plugin to your `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss-canonical"]
}
```

### With prettier-plugin-tailwindcss (class sorting)

This plugin works alongside the official Tailwind CSS Prettier plugin. List `prettier-plugin-tailwindcss-canonical` **first** so classes are canonicalized before sorting:

```json
{
  "plugins": [
    "prettier-plugin-tailwindcss-canonical",
    "prettier-plugin-tailwindcss"
  ]
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tailwindcssCanonicalStylesheet` | `string` | `undefined` | Path to your Tailwind CSS v4 entry stylesheet (relative to project root). If omitted, the plugin uses `@import "tailwindcss"` internally. |
| `tailwindcssCanonicalRootFontSize` | `int` | `16` | Root font size in pixels, used for `rem`-based canonicalization. |

### Example with options

```json
{
  "plugins": ["prettier-plugin-tailwindcss-canonical"],
  "tailwindcssCanonicalStylesheet": "./app/globals.css",
  "tailwindcssCanonicalRootFontSize": 16
}
```

## Supported File Types

`.astro`, `.css`, `.html`, `.js`, `.jsx`, `.less`, `.mdx`, `.scss`, `.svelte`, `.ts`, `.tsx`, `.vue`

## Requirements

- Prettier 3.x
- Tailwind CSS v4
- Node.js >= 18

## License

MIT
