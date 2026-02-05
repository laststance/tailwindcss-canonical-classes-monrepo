import path from 'node:path'
import type { ParserOptions } from 'prettier'
import {
  getDesignSystem,
  canonicalizeDocument,
  inferLanguageId,
} from '@tailwind-canonical/core'
import type { PluginOptions } from './options.js'

/**
 * Map parser names to file extensions for virtual files.
 */
const PARSER_EXTENSION_MAP: Record<string, string> = {
  html: '.html',
  vue: '.vue',
  angular: '.html',
  lwc: '.html',
  babel: '.jsx',
  'babel-flow': '.jsx',
  'babel-ts': '.tsx',
  typescript: '.ts',
  flow: '.js',
  acorn: '.js',
  meriyah: '.js',
  espree: '.js',
  css: '.css',
  scss: '.scss',
  less: '.less',
  astro: '.astro',
  svelte: '.svelte',
  marko: '.marko',
  mdx: '.mdx',
  pug: '.pug',
  liquid: '.liquid',
  twig: '.twig',
  glimmer: '.hbs',
}

type PreprocessFn = (text: string, options: ParserOptions & PluginOptions) => string | Promise<string>

/**
 * Create a preprocess function for a specific parser.
 * @param parserName - The name of the Prettier parser.
 * @returns
 * - A preprocess function that canonicalizes Tailwind classes.
 * @example
 * const preprocess = createPreprocessor('typescript')
 */
export function createPreprocessor(parserName: string): PreprocessFn {
  return async function preprocess(
    text: string,
    options: ParserOptions & PluginOptions,
  ): Promise<string> {
    // Determine file path (use actual filepath or create virtual one)
    const filePath = options.filepath ?? `untitled${PARSER_EXTENSION_MAP[parserName] ?? '.txt'}`

    // Skip if language is not supported
    const languageId = inferLanguageId(filePath)
    if (!languageId) {
      return text
    }

    try {
      // Determine project root from file path
      const projectRoot = options.filepath ? path.dirname(options.filepath) : process.cwd()

      // Load design system (cached)
      const designSystem = await getDesignSystem(
        projectRoot,
        options.tailwindCanonicalStylesheet ?? null,
      )

      // Canonicalize the document
      return await canonicalizeDocument(text, filePath, designSystem, projectRoot, {
        rootFontSize: options.tailwindCanonicalRootFontSize ?? 16,
      })
    } catch (error) {
      // Fail gracefully - return original text if canonicalization fails
      // This prevents Prettier from breaking when Tailwind isn't properly configured
      if (process.env.DEBUG) {
        console.warn('[prettier-plugin-tailwind-canonical]', error)
      }
      return text
    }
  }
}

/**
 * List of parser names to override with canonical preprocessing.
 */
export const SUPPORTED_PARSERS = [
  // HTML-like
  'html',
  'vue',
  'angular',
  'lwc',
  // JavaScript/TypeScript
  'babel',
  'babel-flow',
  'babel-ts',
  'typescript',
  'flow',
  'acorn',
  'meriyah',
  'espree',
  // CSS
  'css',
  'scss',
  'less',
  // Others
  'astro',
  'svelte',
  'mdx',
] as const

export type SupportedParser = (typeof SUPPORTED_PARSERS)[number]
