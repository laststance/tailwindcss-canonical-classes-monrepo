import type { Plugin, Parser, ParserOptions } from 'prettier'
import { options, type PluginOptions } from './options.js'
import {
  getDesignSystem,
  canonicalizeDocument,
  inferLanguageId,
} from '@laststance/tailwindcss-canonical-classes-core'
import { resolveCanonicalProjectContext } from './project-context.js'

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
 *   "tailwindStylesheet": "./app/globals.css",
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
 * Supplies Prettier's fallback when {@link getDelegateParser} finds no earlier parser.
 * @example await loadBuiltinParser('html') // => Prettier HTML parser
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

// Prettier supports lazy parser factories at runtime, but its public types omit them.
type ParserEntry = Parser | (() => Parser | Promise<Parser>)
type RuntimePlugin = Omit<Plugin, 'parsers'> & {
  parsers?: Record<string, ParserEntry>
  default?: RuntimePlugin
}

/**
 * Selects the last other parser for {@link getDelegateParser}, matching Prettier's precedence.
 * @example await findOtherPluginParser('html', [sorter, canonical]) // => sorter HTML parser
 */
async function findOtherPluginParser(
  parserName: string,
  plugins: ParserOptions['plugins'],
): Promise<Parser | null> {
  // Prettier prepends built-ins; searching backward gives user plugins precedence.
  for (const plugin of [...plugins].reverse()) {
    if (typeof plugin === 'string' || plugin instanceof URL) continue
    const runtimePlugin: RuntimePlugin = plugin
    const candidate = runtimePlugin.default ?? runtimePlugin
    const entry = candidate.parsers?.[parserName]

    // Exclude both our map and copied references to our wrapper to prevent recursion.
    if (candidate.parsers === parsers || entry === parsers[parserName]) continue
    const parser = typeof entry === 'function' ? await entry() : entry
    if (parser && parser !== parsers[parserName]) return parser
  }
  return null
}

// Formatting options isolate delegates across concurrent files and plugin configurations.
const delegateParserCache = new WeakMap<
  ParserOptions,
  Map<string, Promise<Parser>>
>()

/**
 * Shares one initialized delegate between each wrapper's preprocess and parse calls.
 * @example await getDelegateParser('html', options) // => same parser within this format call
 */
function getDelegateParser(
  parserName: string,
  parserOptions: ParserOptions,
): Promise<Parser> {
  let delegates = delegateParserCache.get(parserOptions)
  if (!delegates) {
    delegates = new Map()
    delegateParserCache.set(parserOptions, delegates)
  }
  const cached = delegates.get(parserName)
  if (cached) return cached

  // Cache the promise too, so asynchronous factories cannot initialize twice per call.
  const pending = findOtherPluginParser(parserName, parserOptions.plugins).then(
    async (other) => {
      const delegate = other ?? (await loadBuiltinParser(parserName))
      if (delegate) return delegate
      throw new Error(
        `[canonical] Base parser "${parserName}" not available. Make sure Prettier is properly installed.`,
      )
    },
  )
  delegates.set(parserName, pending)
  return pending
}

/**
 * Canonicalizes source before the registered wrapper invokes its delegate.
 * @example await createCanonicalPreprocess('html')('<div class="p-[16px]"></div>', options) // => p-4
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
      const { projectRoot, stylesheetPath } = await resolveCanonicalProjectContext(
        opts,
        filePath,
      )
      const designSystem = await getDesignSystem(
        projectRoot,
        stylesheetPath,
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
const parsers: NonNullable<Plugin['parsers']> = {}

for (const parserName of Object.keys(PARSER_CONFIG)) {
  const config = PARSER_CONFIG[parserName]
  const ourPreprocess = createCanonicalPreprocess(parserName)

  parsers[parserName] = {
    parse: async (text: string, opts: ParserOptions) => {
      const delegate = await getDelegateParser(parserName, opts)
      return delegate.parse(text, opts)
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
      const delegate = await getDelegateParser(parserName, opts)
      // Prettier copies locations before preprocessing; update only this call's options.
      opts.locStart = delegate.locStart.bind(delegate)
      opts.locEnd = delegate.locEnd.bind(delegate)
      const canonicalText = await ourPreprocess(text, opts)

      // Sorters can transform the AST in parse, after their optional preprocessing.
      return delegate.preprocess
        ? await delegate.preprocess(canonicalText, opts)
        : canonicalText
    },
  }
}

export { parsers, options }
