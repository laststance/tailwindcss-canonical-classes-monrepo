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

> **Known issue:** When this plugin is configured together with
> `prettier-plugin-tailwindcss`, canonicalization may not run reliably from the
> VS Code Prettier extension. Depending on your Prettier/plugin resolution, the
> same setup may also fail when running Prettier directly from the command line.
>
> Until this is fixed, prefer running the canonical CLI explicitly with `npx`
> when you need deterministic canonicalization.

If you still want to try both Prettier plugins together, list `prettier-plugin-tailwindcss-canonical-classes` **last** so it can chain with the sorting plugin's preprocess:

```json
{
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-tailwindcss-canonical-classes"
  ]
}
```

To apply canonicalization on demand, run the CLI directly:

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
| `tailwindcssCanonicalStylesheet` | `string` | `undefined` | Path to your Tailwind CSS v4 entry stylesheet (relative to project root). If omitted, the plugin uses `@import "tailwindcss"` internally. |
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

- Prettier 3.x
- Tailwind CSS v4
- Node.js >= 18

## License

MIT
