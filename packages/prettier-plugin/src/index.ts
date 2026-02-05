import type { Plugin, Parser, ParserOptions, AstPath, Doc, Printer } from 'prettier'
import { options, type PluginOptions } from './options.js'
import path from 'node:path'
import {
  getDesignSystem,
  canonicalizeDocument,
  inferLanguageId,
} from '@tailwindcss-canonical/core'

/**
 * Prettier plugin for canonicalizing Tailwind CSS classes.
 *
 * This plugin extends Prettier's built-in parsers to add a preprocess step
 * that canonicalizes Tailwind CSS class names using the v4 language service.
 *
 * @example .prettierrc
 * ```json
 * {
 *   "plugins": ["prettier-plugin-tailwindcss-canonical"],
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

/**
 * Create a preprocess function that canonicalizes Tailwind classes.
 */
function createPreprocess(parserName: string) {
  return async function preprocess(
    text: string,
    opts: ParserOptions & PluginOptions,
  ): Promise<string> {
    const filePath = opts.filepath ?? `untitled${PARSER_EXTENSION_MAP[parserName] ?? '.txt'}`
    const languageId = inferLanguageId(filePath)

    if (!languageId) {
      return text
    }

    try {
      // Use cwd as project root (where .prettierrc is located)
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
        console.warn('[prettier-plugin-tailwindcss-canonical]', error)
      }
      return text
    }
  }
}

// Configuration for loading base parsers
// Note: We use babel-ts for typescript to maintain consistency
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

// Cache for loaded base parsers
const baseParserCache = new Map<string, Parser>()

/**
 * Load a base parser from Prettier's built-in plugins.
 */
async function loadBaseParser(parserName: string): Promise<Parser | null> {
  if (baseParserCache.has(parserName)) {
    return baseParserCache.get(parserName)!
  }

  const config = PARSER_CONFIG[parserName]
  if (!config) {
    return null
  }

  try {
    const plugin = await import(config.module)
    const parser = plugin.parsers?.[config.parser]
    if (parser) {
      baseParserCache.set(parserName, parser)
      return parser
    }
  } catch (err) {
    if (process.env.DEBUG) {
      console.warn(`[prettier-plugin-tailwindcss-canonical] Failed to load ${config.module}:`, err)
    }
  }

  return null
}

/**
 * Wrap a parser with our preprocess hook.
 */
function wrapParser(baseParser: Parser, parserName: string): Parser {
  const ourPreprocess = createPreprocess(parserName)

  return {
    ...baseParser,
    preprocess: async (text: string, opts: ParserOptions & PluginOptions) => {
      // Run our canonicalization first
      let processed = await ourPreprocess(text, opts)
      // Then run the original preprocess if it exists
      if (baseParser.preprocess) {
        const result = baseParser.preprocess(processed, opts)
        processed = result instanceof Promise ? await result : result
      }
      return processed
    },
  }
}

// Build parsers by extending Prettier's built-in parsers
const parsers: Plugin['parsers'] = {}

// Initialize parsers - load base parsers and wrap them with our preprocess
for (const parserName of Object.keys(PARSER_CONFIG)) {
  const config = PARSER_CONFIG[parserName]
  const ourPreprocess = createPreprocess(parserName)

  // Create a parser that loads the base parser on first use and properly delegates
  parsers[parserName] = {
    parse: async (text: string, opts: ParserOptions) => {
      const baseParser = await loadBaseParser(parserName)
      if (!baseParser) {
        throw new Error(
          `[prettier-plugin-tailwindcss-canonical] Base parser "${parserName}" not available. ` +
            `Make sure Prettier is properly installed.`,
        )
      }
      return baseParser.parse(text, opts)
    },
    astFormat: config.astFormat,
    locStart: (node: any) => {
      // Delegate to base parser's locStart if available
      const baseParser = baseParserCache.get(parserName)
      if (baseParser?.locStart) {
        return baseParser.locStart(node)
      }
      // Fallback
      if (typeof node.start === 'number') return node.start
      if (node.loc?.start?.offset !== undefined) return node.loc.start.offset
      if (node.sourceSpan?.start?.offset !== undefined) return node.sourceSpan.start.offset
      return 0
    },
    locEnd: (node: any) => {
      // Delegate to base parser's locEnd if available
      const baseParser = baseParserCache.get(parserName)
      if (baseParser?.locEnd) {
        return baseParser.locEnd(node)
      }
      // Fallback
      if (typeof node.end === 'number') return node.end
      if (node.loc?.end?.offset !== undefined) return node.loc.end.offset
      if (node.sourceSpan?.end?.offset !== undefined) return node.sourceSpan.end.offset
      return 0
    },
    preprocess: ourPreprocess,
  }
}

export { parsers, options }
