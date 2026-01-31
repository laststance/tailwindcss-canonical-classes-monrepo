#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import minimist from 'minimist'
import { glob } from 'tinyglobby'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createJiti } from 'jiti'
import {
  createState,
  getDefaultTailwindSettings,
  doValidate,
  DiagnosticKind,
  isSuggestCanonicalClasses,
  type Settings,
  type State,
} from '@tailwindcss/language-service'

const CLI_NAME = 'tailwind-suggest-canonical'
const DEFAULT_DOCUMENT_VERSION = 1
const DEFAULT_ROOT_FONT_SIZE_REM = 16
const DEFAULT_TAILWIND_CSS = '@import \"tailwindcss\";'
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1

const SUPPORTED_EXTENSIONS = new Set([
  '.astro',
  '.css',
  '.html',
  '.htm',
  '.js',
  '.jsx',
  '.less',
  '.md',
  '.mdx',
  '.mjs',
  '.mts',
  '.pcss',
  '.postcss',
  '.sass',
  '.scss',
  '.styl',
  '.stylus',
  '.sss',
  '.svelte',
  '.ts',
  '.tsx',
  '.vue',
])

type WriteMode = 'write' | 'check'

type CliArgs = {
  targets: string[]
  rootDir: string
  cssPath: string | null
  rootFontSize: number
  writeMode: WriteMode
  verbose: boolean
  help: boolean
}

type TextEdit = {
  startOffset: number
  endOffset: number
  replacement: string
  original: string
}

type FileResultStatus = 'changed' | 'unchanged' | 'skipped' | 'error'

type FileResult = {
  filePath: string
  status: FileResultStatus
  editCount: number
  message?: string
}

type DesignSystem = {
  canonicalizeCandidates?: (classes: string[], options?: { rem?: number }) => string[]
  invalidCandidates?: Set<string>
}

void main()

/**
 * Run the CLI end-to-end.
 * @returns
 * - Resolves when the process finishes successfully.
 * - Rejects if a fatal error prevents processing.
 * @example
 * await main()
 */
async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2))

  if (args.help || args.targets.length === 0) {
    console.log(buildUsage())
    process.exit(args.targets.length === 0 ? EXIT_FAILURE : EXIT_SUCCESS)
  }

  const targets = await resolveTargetFiles(args.targets, args.rootDir)
  if (targets.length === 0) {
    console.error('No matching files found.')
    process.exit(EXIT_FAILURE)
  }

  const settings = createSettings(args.rootFontSize)
  const designSystem = await loadTailwindDesignSystem(args.rootDir, args.cssPath)

  if (!designSystem?.canonicalizeCandidates) {
    console.error('Tailwind v4 design system was not detected. Canonicalization is unavailable.')
    process.exit(EXIT_FAILURE)
  }

  const state = createState({
    v4: true,
    designSystem: designSystem as State['designSystem'],
    blocklist: Array.from(designSystem.invalidCandidates ?? []),
    editor: {
      folder: args.rootDir,
      userLanguages: {},
      getConfiguration: async () => settings,
    },
  })

  const results: FileResult[] = []
  for (const filePath of targets) {
    results.push(await processFile(state, filePath, args.writeMode))
  }

  const { changed, unchanged, skipped, errors } = summarizeResults(results)
  if (args.verbose || args.writeMode === 'check') {
    for (const result of results) {
      if (args.writeMode === 'check' && result.status !== 'changed') {
        continue
      }
      if (result.status === 'error') {
        console.error(`${result.status}: ${result.filePath} ${result.message ?? ''}`.trim())
        continue
      }
      console.log(`${result.status}: ${result.filePath} (${result.editCount})`)
    }
  }
  console.log(
    `Done. changed=${changed} unchanged=${unchanged} skipped=${skipped} errors=${errors}`,
  )

  if (errors > 0) {
    process.exit(EXIT_FAILURE)
  }
}

/**
 * Parse CLI arguments into a structured configuration.
 * @param argv - Raw arguments without the node/bin prefix.
 * @returns
 * - Parsed CLI arguments ready for use.
 * - Defaults applied when flags are omitted.
 * @example
 * parseCliArgs(['src/components/*.tsx', '--check'])
 */
function parseCliArgs(argv: string[]): CliArgs {
  const parsed = minimist(argv, {
    boolean: ['check', 'dry-run', 'help', 'verbose'],
    string: ['root', 'css', 'root-font-size'],
    alias: {
      h: 'help',
      v: 'verbose',
    },
    default: {
      root: process.cwd(),
    },
  })

  const requestedRoot = typeof parsed.root === 'string' ? parsed.root : process.cwd()
  const rootDir = path.resolve(requestedRoot)
  const rawRootFontSize = parsed['root-font-size']
  const rootFontSize = normalizeRootFontSize(rawRootFontSize)
  const writeMode: WriteMode = parsed.check || parsed['dry-run'] ? 'check' : 'write'

  return {
    targets: parsed._.map(String),
    rootDir,
    cssPath: typeof parsed.css === 'string' ? parsed.css : null,
    rootFontSize,
    writeMode,
    verbose: Boolean(parsed.verbose),
    help: Boolean(parsed.help),
  }
}

/**
 * Normalize the root font size value.
 * @param value - The raw value provided by the CLI.
 * @returns
 * - A positive numeric root font size.
 * - The default size when input is invalid.
 * @example
 * normalizeRootFontSize('18') // => 18
 */
function normalizeRootFontSize(value: unknown): number {
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }
  return DEFAULT_ROOT_FONT_SIZE_REM
}

/**
 * Build a short help string for the CLI.
 * @returns
 * - A human-readable usage string.
 * - Includes available flags and examples.
 * @example
 * console.log(buildUsage())
 */
function buildUsage(): string {
  return [
    `${CLI_NAME} <files/globs> [options]`,
    '',
    'Options:',
    '  --root <dir>             Project root directory (default: cwd)',
    '  --css <file>             Tailwind v4 entry CSS (default: @import \"tailwindcss\")',
    '  --root-font-size <num>   Root font size in px (default: 16)',
    '  --check                  Dry run (no writes)',
    '  --dry-run                Alias for --check',
    '  --verbose                Print per-file results',
    '  --help                   Show this help',
    '',
    'Examples:',
    `  ${CLI_NAME} \"src/**/*.{html,tsx}\"`,
    `  ${CLI_NAME} \"**/*.svelte\" --check`,
  ].join('\n')
}

/**
 * Resolve CLI targets into absolute file paths.
 * @param targets - File paths or glob patterns.
 * @param rootDir - Root directory for glob resolution.
 * @returns
 * - A de-duplicated list of absolute file paths.
 * - Empty list when no files match.
 * @example
 * await resolveTargetFiles(['src/components/*.tsx'], process.cwd())
 */
async function resolveTargetFiles(targets: string[], rootDir: string): Promise<string[]> {
  const files = await glob(targets, {
    cwd: rootDir,
    absolute: true,
    onlyFiles: true,
    expandDirectories: false,
    dot: true,
  })

  const seen = new Set<string>()
  const result: string[] = []
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase()
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      continue
    }
    if (!seen.has(filePath)) {
      seen.add(filePath)
      result.push(filePath)
    }
  }

  return result
}

/**
 * Create Tailwind language service settings with updated root font size.
 * @param rootFontSize - Root font size in pixels.
 * @returns
 * - Tailwind language service settings ready for diagnostics.
 * - Default linting options preserved.
 * @example
 * const settings = createSettings(16)
 */
function createSettings(rootFontSize: number): Settings {
  const settings = getDefaultTailwindSettings()
  settings.tailwindCSS.rootFontSize = rootFontSize
  return settings
}

/**
 * Load the Tailwind v4 design system used for canonicalization.
 * @param rootDir - Project root directory.
 * @param cssPath - Optional CSS entry file.
 * @returns
 * - A Tailwind design system when v4 is available.
 * - null when v4 APIs are unavailable.
 * @example
 * const designSystem = await loadTailwindDesignSystem(process.cwd(), null)
 */
async function loadTailwindDesignSystem(
  rootDir: string,
  cssPath: string | null,
): Promise<DesignSystem | null> {
  const tailwindModule = await import('tailwindcss')
  const loadDesignSystem =
    (tailwindModule as any).__unstable__loadDesignSystem ??
    (tailwindModule as any).default?.__unstable__loadDesignSystem
  if (typeof loadDesignSystem !== 'function') {
    return null
  }

  const cssContent = cssPath
    ? await fs.readFile(path.resolve(rootDir, cssPath), 'utf8')
    : DEFAULT_TAILWIND_CSS

  const cssBase = cssPath ? path.dirname(path.resolve(rootDir, cssPath)) : rootDir
  const jiti = createJiti(import.meta.url, { moduleCache: false, fsCache: false })

  const designSystem = await loadDesignSystem(cssContent, {
    base: cssBase,
    loadStylesheet: async (id: string, base: string) => {
      const resolved = await resolveStylesheetPath(id, base)
      if (!resolved) {
        return { base, content: '' }
      }
      return {
        base: path.dirname(resolved),
        content: await fs.readFile(resolved, 'utf8'),
      }
    },
    loadModule: async (id: string, base: string, resourceType: string) => {
      const resolved = await resolveModulePath(id, base)
      if (!resolved) {
        return { base, module: fallbackModule(resourceType) }
      }
      const url = pathToFileURL(resolved)
      return {
        base: path.dirname(resolved),
        module: await jiti.import(url.href, { default: true }),
      }
    },
    loadConfig: async (id: string) => {
      const resolved = await resolveModulePath(id, cssBase)
      if (!resolved) return {}
      const url = pathToFileURL(resolved)
      return jiti.import(url.href, { default: true })
    },
    loadPlugin: async (id: string) => {
      const resolved = await resolveModulePath(id, cssBase)
      if (!resolved) return () => {}
      const url = pathToFileURL(resolved)
      return jiti.import(url.href, { default: true })
    },
  })

  return designSystem as DesignSystem
}

/**
 * Resolve a module or file path relative to a base directory.
 * @param id - Module specifier or file path.
 * @param baseDir - Base directory for resolution.
 * @returns
 * - Absolute file path if resolved.
 * - null if resolution fails.
 * @example
 * await resolveModulePath('./tailwind.config.ts', process.cwd())
 */
async function resolveModulePath(id: string, baseDir: string): Promise<string | null> {
  if (path.isAbsolute(id)) {
    return id
  }

  if (id.startsWith('.')) {
    return path.resolve(baseDir, id)
  }

  const resolver = createRequire(import.meta.url)
  try {
    return resolver.resolve(id, { paths: [baseDir] })
  } catch {
    const fallback = path.join(baseDir, 'node_modules', id)
    if (await fileExists(fallback)) {
      return fallback
    }
    return null
  }
}

/**
 * Resolve a stylesheet path, including Tailwind CSS aliases.
 * @param id - Import identifier from CSS.
 * @param baseDir - Base directory for resolution.
 * @returns
 * - Absolute file path when resolved.
 * - null when not found.
 * @example
 * await resolveStylesheetPath('tailwindcss', process.cwd())
 */
async function resolveStylesheetPath(id: string, baseDir: string): Promise<string | null> {
  const aliased = mapTailwindCssAlias(id)
  return resolveModulePath(aliased, baseDir)
}

/**
 * Map Tailwind CSS import aliases to concrete files.
 * @param id - The raw stylesheet identifier.
 * @returns
 * - A resolved alias string if matched.
 * - The original id otherwise.
 * @example
 * mapTailwindCssAlias('tailwindcss') // => 'tailwindcss/index.css'
 */
function mapTailwindCssAlias(id: string): string {
  switch (id) {
    case 'tailwindcss':
      return 'tailwindcss/index.css'
    case 'tailwindcss/index':
      return 'tailwindcss/index.css'
    case 'tailwindcss/preflight':
      return 'tailwindcss/preflight.css'
    case 'tailwindcss/theme':
      return 'tailwindcss/theme.css'
    case 'tailwindcss/utilities':
      return 'tailwindcss/utilities.css'
    default:
      return id
  }
}

/**
 * Check whether a file exists on disk.
 * @param filePath - Absolute file path to check.
 * @returns
 * - true when the file exists.
 * - false when the file does not exist.
 * @example
 * await fileExists('/tmp/example.txt')
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}

/**
 * Provide a minimal fallback module for a missing resource.
 * @param resourceType - The resource type requested by Tailwind.
 * @returns
 * - A no-op plugin for missing plugins.
 * - An empty config object for missing configs.
 * @example
 * fallbackModule('plugin')
 */
function fallbackModule(resourceType: string): unknown {
  if (resourceType === 'plugin') {
    return () => {}
  }
  return {}
}

/**
 * Process a single file and apply canonical class edits.
 * @param state - Tailwind language service state.
 * @param filePath - Absolute path to the target file.
 * @param writeMode - Whether to write or just check.
 * @returns
 * - A result summary describing the outcome.
 * - Includes edit count and status.
 * @example
 * await processFile(state, '/tmp/index.html', 'check')
 */
async function processFile(
  state: State,
  filePath: string,
  writeMode: WriteMode,
): Promise<FileResult> {
  try {
    const text = await fs.readFile(filePath, 'utf8')
    const languageId = inferLanguageId(filePath)
    if (!languageId) {
      return { filePath, status: 'skipped', editCount: 0, message: 'Unsupported extension' }
    }

    const document = createTextDocument(filePath, languageId, text)
    const edits = await buildCanonicalEdits(state, document)
    if (edits.length === 0) {
      return { filePath, status: 'unchanged', editCount: 0 }
    }

    const nextText = applyTextEdits(text, edits)
    if (nextText === text) {
      return { filePath, status: 'unchanged', editCount: 0 }
    }

    if (writeMode === 'write') {
      await fs.writeFile(filePath, nextText, 'utf8')
    }

    return { filePath, status: 'changed', editCount: edits.length }
  } catch (error) {
    return {
      filePath,
      status: 'error',
      editCount: 0,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Infer a language id from a file extension.
 * @param filePath - The file path to inspect.
 * @returns
 * - A Tailwind language service language id.
 * - null when the extension is unsupported.
 * @example
 * inferLanguageId('app.tsx') // => 'typescriptreact'
 */
function inferLanguageId(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.css':
    case '.less':
    case '.pcss':
    case '.postcss':
    case '.scss':
    case '.sass':
    case '.styl':
    case '.stylus':
    case '.sss':
      return 'css'
    case '.html':
    case '.htm':
    case '.md':
    case '.mdx':
      return 'html'
    case '.js':
    case '.mjs':
      return 'javascript'
    case '.jsx':
      return 'javascriptreact'
    case '.ts':
    case '.mts':
      return 'typescript'
    case '.tsx':
      return 'typescriptreact'
    case '.vue':
      return 'vue'
    case '.svelte':
      return 'svelte'
    case '.astro':
      return 'astro'
    default:
      return null
  }
}

/**
 * Create a TextDocument for the language service pipeline.
 * @param filePath - Absolute file path.
 * @param languageId - Language id for the document.
 * @param text - File contents.
 * @returns
 * - A VSCode TextDocument instance.
 * - Ready for Tailwind language service utilities.
 * @example
 * createTextDocument('/tmp/a.html', 'html', '<div class=\"p-4\" />')
 */
function createTextDocument(filePath: string, languageId: string, text: string): TextDocument {
  return TextDocument.create(
    toFileUri(filePath),
    languageId,
    DEFAULT_DOCUMENT_VERSION,
    text,
  )
}

/**
 * Convert a file path to a file:// URI string.
 * @param filePath - Absolute file path.
 * @returns
 * - A file URI string.
 * - Suitable for TextDocument.create.
 * @example
 * toFileUri('/tmp/a.html')
 */
function toFileUri(filePath: string): string {
  return pathToFileURL(filePath).href
}

/**
 * Build canonicalization edits for a document.
 * @param state - Tailwind language service state.
 * @param document - TextDocument to scan.
 * @returns
 * - A list of text edits for canonical replacements.
 * - Empty list if no changes are needed.
 * @example
 * await buildCanonicalEdits(state, doc)
 */
async function buildCanonicalEdits(state: State, document: TextDocument): Promise<TextEdit[]> {
  const diagnostics = await doValidate(state, document, [DiagnosticKind.SuggestCanonicalClasses])
  const edits: TextEdit[] = []

  for (const diagnostic of diagnostics) {
    if (!isSuggestCanonicalClasses(diagnostic)) {
      continue
    }

    const suggestion = diagnostic.suggestions?.[0]
    if (!suggestion) {
      continue
    }

    const startOffset = document.offsetAt(diagnostic.range.start)
    const endOffset = document.offsetAt(diagnostic.range.end)
    if (startOffset >= endOffset) {
      continue
    }

    edits.push({
      startOffset,
      endOffset,
      replacement: suggestion,
      original: document.getText(diagnostic.range),
    })
  }

  return dedupeEdits(edits)
}

/**
 * Remove duplicate edits by offset range.
 * @param edits - The raw edits list.
 * @returns
 * - A de-duplicated list of edits.
 * - Preserves the first occurrence of each range.
 * @example
 * dedupeEdits([{ startOffset: 0, endOffset: 1, replacement: 'x', original: 'y' }])
 */
function dedupeEdits(edits: TextEdit[]): TextEdit[] {
  const seen = new Set<string>()
  const result: TextEdit[] = []
  for (const edit of edits) {
    const key = `${edit.startOffset}:${edit.endOffset}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(edit)
  }
  return result
}

/**
 * Apply text edits from the end of the document backwards.
 * @param text - Original file text.
 * @param edits - Text edits to apply.
 * @returns
 * - Updated file text after applying edits.
 * - Original text if no edits apply.
 * @example
 * applyTextEdits('a b', [{ startOffset: 0, endOffset: 1, replacement: 'c', original: 'a' }])
 */
function applyTextEdits(text: string, edits: TextEdit[]): string {
  if (edits.length === 0) return text

  const sorted = [...edits].sort((a, b) => b.startOffset - a.startOffset)
  let output = text
  let lastStart = Number.POSITIVE_INFINITY

  for (const edit of sorted) {
    if (edit.endOffset > lastStart) {
      continue
    }
    output =
      output.slice(0, edit.startOffset) + edit.replacement + output.slice(edit.endOffset)
    lastStart = edit.startOffset
  }

  return output
}

/**
 * Summarize processing results for reporting.
 * @param results - Per-file results.
 * @returns
 * - Counts for each result status.
 * - Useful for final CLI output.
 * @example
 * summarizeResults([{ filePath: 'a', status: 'changed', editCount: 1 }])
 */
function summarizeResults(results: FileResult[]): {
  changed: number
  unchanged: number
  skipped: number
  errors: number
} {
  let changed = 0
  let unchanged = 0
  let skipped = 0
  let errors = 0

  for (const result of results) {
    switch (result.status) {
      case 'changed':
        changed += 1
        break
      case 'unchanged':
        unchanged += 1
        break
      case 'skipped':
        skipped += 1
        break
      case 'error':
        errors += 1
        break
      default:
        break
    }
  }

  return { changed, unchanged, skipped, errors }
}
