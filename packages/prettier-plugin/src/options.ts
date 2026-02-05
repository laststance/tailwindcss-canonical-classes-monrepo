import type { SupportOption } from 'prettier'

/**
 * Prettier options for the Tailwind canonical plugin.
 */
export const options: Record<string, SupportOption> = {
  tailwindcssCanonicalStylesheet: {
    type: 'string',
    category: 'TailwindCSS Canonical',
    default: undefined,
    description: 'Path to Tailwind CSS v4 entry stylesheet (relative to project root)',
  },
  tailwindcssCanonicalRootFontSize: {
    type: 'int',
    category: 'TailwindCSS Canonical',
    default: 16,
    description: 'Root font size in pixels for rem-based canonicalization',
  },
}

/**
 * Plugin options interface for type safety.
 */
export interface PluginOptions {
  tailwindcssCanonicalStylesheet?: string
  tailwindcssCanonicalRootFontSize?: number
}
