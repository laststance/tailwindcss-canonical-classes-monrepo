# Playground

Next.js 16 + shadcn/ui test app for verifying CLI and Prettier plugin behavior.

## Setup

```bash
cd playground
pnpm install
```

## Scripts

```bash
pnpm dev            # Start dev server (http://localhost:3000)
pnpm build          # Production build
pnpm format         # Run Prettier (canonical + sorting)
pnpm format:check   # Check without modifying
```

## Prettier Plugin Configuration

Both the canonical plugin and the official sorting plugin are configured in `.prettierrc`.
The canonical plugin must be listed **last** so it can chain with the sorting plugin's preprocess:

```json
{
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-tailwindcss-canonical-classes"
  ],
  "tailwindcssCanonicalStylesheet": "./app/globals.css"
}
```

## Structure

```
app/
├── globals.css          # Tailwind v4 theme (includes custom xs breakpoint)
├── page.tsx             # Top page
├── page/
│   └── FeedItem.tsx     # Test file for canonical class conversion
└── showcase/
    ├── data-display/    # Data display components
    ├── feedback/        # Feedback components
    ├── forms/           # Form components
    ├── layout-components/
    └── navigation/      # Navigation components
```

## Testing Canonical Conversion

```bash
# Check if non-canonical classes exist
pnpm format:check

# Apply canonical conversion + sorting
pnpm format

# Verify with CLI (verbose output)
cd .. && node packages/cli/dist/cli.js "playground/**/*.tsx" --check --verbose --css playground/app/globals.css
```

> **Note:** Discard playground changes after testing: `git checkout playground/`
