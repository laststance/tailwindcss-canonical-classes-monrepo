import type { SupportOption } from 'prettier'

/**
 * Prettier options for the Tailwind canonical plugin.
 */
export const options: Record<string, SupportOption> = {
  tailwindCanonicalStylesheet: {
    type: 'string',
    category: 'Tailwind Canonical',
    default: undefined,
    description: 'Path to Tailwind CSS v4 entry stylesheet (relative to project root)',
  },
  tailwindCanonicalRootFontSize: {
    type: 'int',
    category: 'Tailwind Canonical',
    default: 16,
    description: 'Root font size in pixels for rem-based canonicalization',
  },
}

/**
 * Plugin options interface for type safety.
 */
export interface PluginOptions {
  tailwindCanonicalStylesheet?: string
  tailwindCanonicalRootFontSize?: number
}
