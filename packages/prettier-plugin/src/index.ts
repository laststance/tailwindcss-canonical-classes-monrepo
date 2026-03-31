import type { Plugin, Parser, ParserOptions } from 'prettier'
import { options, type PluginOptions } from './options.js'
import {
  getDesignSystem,
  canonicalizeDocument,
  inferLanguageId,
} from '@laststance/tailwindcss-canonical-classes-core'

/**
 * Prettier plugin for canonicalizing Tailwind CSS classes.
 *
 * This plugin extends Prettier's built-in parsers to add a preprocess step
 * that canonicalizes Tailwind CSS class names using the v4 language service.
 *
 * When used with other plugins (e.g., prettier-plugin-tailwindcss for sorting),
 * this plugin MUST be listed LAST in the plugins array so its parsers take
 * precedence, while chaining with earlier plugins' preprocess and parse.
 *
 * @example .prettierrc
 * ```json
 * {
 *   "plugins": [
 *     "prettier-plugin-tailwindcss",
 *     "prettier-plugin-tailwindcss-canonical-classes"
 *   ],
 *   "tailwindcssCanonicalStylesheet": "./app/globals.css"
 * }
 * ```
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
  mdx: '.mdx',
}

// Configuration for parser astFormat (used when falling back to built-in parsers)
const PARSER_CONFIG: Record<string, { module: string; parser: string; astFormat: string }> = {
  html: { module: 'prettier/plugins/html', parser: 'html', astFormat: 'html' },
  vue: { module: 'prettier/plugins/html', parser: 'vue', astFormat: 'html' },
  angular: { module: 'prettier/plugins/html', parser: 'angular', astFormat: 'html' },
  lwc: { module: 'prettier/plugins/html', parser: 'lwc', astFormat: 'html' },
  babel: { module: 'prettier/plugins/babel', parser: 'babel', astFormat: 'estree' },
  'babel-flow': { module: 'prettier/plugins/babel', parser: 'babel-flow', astFormat: 'estree' },
  'babel-ts': { module: 'prettier/plugins/babel', parser: 'babel-ts', astFormat: 'estree' },
  typescript: { module: 'prettier/plugins/typescript', parser: 'typescript', astFormat: 'estree' },
  flow: { module: 'prettier/plugins/babel', parser: 'flow', astFormat: 'estree' },
  acorn: { module: 'prettier/plugins/acorn', parser: 'acorn', astFormat: 'estree' },
  meriyah: { module: 'prettier/plugins/acorn', parser: 'meriyah', astFormat: 'estree' },
  espree: { module: 'prettier/plugins/acorn', parser: 'espree', astFormat: 'estree' },
  css: { module: 'prettier/plugins/postcss', parser: 'css', astFormat: 'postcss' },
  scss: { module: 'prettier/plugins/postcss', parser: 'scss', astFormat: 'postcss' },
  less: { module: 'prettier/plugins/postcss', parser: 'less', astFormat: 'postcss' },
  mdx: { module: 'prettier/plugins/markdown', parser: 'mdx', astFormat: 'mdast' },
}

// Cache for loaded built-in parsers
const builtinParserCache = new Map<string, Parser>()

/**
 * Load a built-in parser from Prettier's bundled plugins.
 * Used as fallback when no other plugin provides a parser.
 */
async function loadBuiltinParser(parserName: string): Promise<Parser | null> {
  if (builtinParserCache.has(parserName)) {
    return builtinParserCache.get(parserName)!
  }

  const config = PARSER_CONFIG[parserName]
  if (!config) return null

  try {
    const plugin = await import(config.module)
    const parser = plugin.parsers?.[config.parser]
    if (parser) {
      builtinParserCache.set(parserName, parser)
      return parser
    }
  } catch (err) {
    if (process.env.DEBUG) {
      console.warn(`[canonical] Failed to load ${config.module}:`, err)
    }
  }

  return null
}

/**
 * Find another plugin's parser for the given parser name.
 * Skips our own parsers to avoid infinite recursion.
 * Handles both direct plugin objects and module-wrapped plugins.
 */
function findOtherPluginParser(
  parserName: string,
  plugins: any[],
): Parser | null {
  for (const plugin of plugins) {
    // Handle module default exports
    const p = plugin.default ?? plugin
    // Skip our own plugin
    if (p.parsers === parsers) continue
    const parser = p.parsers?.[parserName]
    if (parser && typeof parser.parse === 'function') return parser
  }
  return null
}

/**
 * Create the canonicalization preprocess function.
 */
function createCanonicalPreprocess(parserName: string) {
  return async function canonicalPreprocess(
    text: string,
    opts: ParserOptions & PluginOptions,
  ): Promise<string> {
    const filePath = opts.filepath ?? `untitled${PARSER_EXTENSION_MAP[parserName] ?? '.txt'}`
    const languageId = inferLanguageId(filePath)

    if (!languageId) return text

    try {
      const projectRoot = process.cwd()
      const designSystem = await getDesignSystem(
        projectRoot,
        opts.tailwindcssCanonicalStylesheet ?? null,
      )

      return await canonicalizeDocument(text, filePath, designSystem, projectRoot, {
        rootFontSize: opts.tailwindcssCanonicalRootFontSize ?? 16,
      })
    } catch (error) {
      if (process.env.DEBUG) {
        console.warn('[canonical]', error)
      }
      return text
    }
  }
}

// Build parsers that chain with other plugins
const parsers: Plugin['parsers'] = {}

for (const parserName of Object.keys(PARSER_CONFIG)) {
  const config = PARSER_CONFIG[parserName]
  const ourPreprocess = createCanonicalPreprocess(parserName)

  parsers[parserName] = {
    parse: async (text: string, opts: ParserOptions) => {
      // Always use Prettier's built-in parser for AST generation.
      // Other plugins (e.g., prettier-plugin-tailwindcss) do their work in preprocess
      // at the text level — they don't need their parse called directly.
      const builtinParser = await loadBuiltinParser(parserName)
      if (builtinParser) {
        return builtinParser.parse(text, opts)
      }

      throw new Error(
        `[canonical] Base parser "${parserName}" not available. ` +
          `Make sure Prettier is properly installed.`,
      )
    },

    astFormat: config.astFormat,

    locStart: (node: any) => {
      const cached = builtinParserCache.get(parserName)
      if (cached?.locStart) return cached.locStart(node)
      if (typeof node.start === 'number') return node.start
      if (node.loc?.start?.offset !== undefined) return node.loc.start.offset
      if (node.sourceSpan?.start?.offset !== undefined) return node.sourceSpan.start.offset
      return 0
    },

    locEnd: (node: any) => {
      const cached = builtinParserCache.get(parserName)
      if (cached?.locEnd) return cached.locEnd(node)
      if (typeof node.end === 'number') return node.end
      if (node.loc?.end?.offset !== undefined) return node.loc.end.offset
      if (node.sourceSpan?.end?.offset !== undefined) return node.sourceSpan.end.offset
      return 0
    },

    preprocess: async (text: string, opts: ParserOptions & PluginOptions) => {
      // 1. Run our canonicalization FIRST
      let processed = await ourPreprocess(text, opts)

      // 2. Chain with other plugins' preprocess (e.g., sorting from prettier-plugin-tailwindcss)
      const otherParser = findOtherPluginParser(parserName, (opts as any).plugins ?? [])
      if (otherParser?.preprocess) {
        const result = otherParser.preprocess(processed, opts)
        processed = result instanceof Promise ? await result : result
      }

      return processed
    },
  }
}

export { parsers, options }
