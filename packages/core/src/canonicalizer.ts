import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  createState,
  getDefaultTailwindSettings,
  doValidate,
  DiagnosticKind,
  isSuggestCanonicalClasses,
  type Settings,
  type State,
} from '@tailwindcss/language-service'
import type { DesignSystem, TextEdit, CanonicalizeOptions } from './types.js'

const DEFAULT_DOCUMENT_VERSION = 1
const DEFAULT_ROOT_FONT_SIZE = 16

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

/**
 * Canonicalize Tailwind classes in a document.
 * @param text - File contents.
 * @param filePath - Absolute file path.
 * @param designSystem - Loaded Tailwind design system.
 * @param rootDir - Project root directory.
 * @param options - Canonicalization options.
 * @returns
 * - Updated file text with canonical classes.
 * - Original text if no changes needed.
 * @example
 * const result = await canonicalizeDocument(text, '/app/page.tsx', ds, '/app')
 */
export async function canonicalizeDocument(
  text: string,
  filePath: string,
  designSystem: DesignSystem,
  rootDir: string,
  options: CanonicalizeOptions = {},
): Promise<string> {
  const languageId = inferLanguageId(filePath)
  if (!languageId) {
    return text
  }

  const settings = createSettings(options.rootFontSize ?? DEFAULT_ROOT_FONT_SIZE)
  const state = createLanguageServiceState(designSystem, rootDir, settings)
  const document = createTextDocument(filePath, languageId, text)
  const edits = await buildCanonicalEdits(state, document)

  if (edits.length === 0) {
    return text
  }

  return applyTextEdits(text, edits)
}

/**
 * Create a Tailwind language service state.
 * @param designSystem - Loaded design system.
 * @param rootDir - Project root directory.
 * @param settings - Language service settings.
 * @returns
 * - Configured language service state.
 */
export function createLanguageServiceState(
  designSystem: DesignSystem,
  rootDir: string,
  settings: Settings,
): State {
  return createState({
    v4: true,
    designSystem: designSystem as State['designSystem'],
    blocklist: Array.from(designSystem.invalidCandidates ?? []),
    editor: {
      folder: rootDir,
      userLanguages: {},
      getConfiguration: async () => settings,
    },
  })
}

/**
 * Create Tailwind language service settings with updated root font size.
 * @param rootFontSize - Root font size in pixels.
 * @returns
 * - Tailwind language service settings ready for diagnostics.
 */
export function createSettings(rootFontSize: number): Settings {
  const settings = getDefaultTailwindSettings()
  settings.tailwindCSS.rootFontSize = rootFontSize
  return settings
}

/**
 * Build canonicalization edits for a document.
 * @param state - Tailwind language service state.
 * @param document - TextDocument to scan.
 * @returns
 * - A list of text edits for canonical replacements.
 * - Empty list if no changes are needed.
 */
export async function buildCanonicalEdits(
  state: State,
  document: TextDocument,
): Promise<TextEdit[]> {
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
 */
export function dedupeEdits(edits: TextEdit[]): TextEdit[] {
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
 */
export function applyTextEdits(text: string, edits: TextEdit[]): string {
  if (edits.length === 0) return text

  const sorted = [...edits].sort((a, b) => b.startOffset - a.startOffset)
  let output = text
  let lastStart = Number.POSITIVE_INFINITY

  for (const edit of sorted) {
    if (edit.endOffset > lastStart) {
      continue
    }
    output = output.slice(0, edit.startOffset) + edit.replacement + output.slice(edit.endOffset)
    lastStart = edit.startOffset
  }

  return output
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
export function inferLanguageId(filePath: string): string | null {
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
 * Check if a file extension is supported for canonicalization.
 * @param filePath - The file path to check.
 * @returns
 * - true if the extension is supported.
 * - false otherwise.
 */
export function isSupportedExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return SUPPORTED_EXTENSIONS.has(ext)
}

/**
 * Create a TextDocument for the language service pipeline.
 * @param filePath - Absolute file path.
 * @param languageId - Language id for the document.
 * @param text - File contents.
 * @returns
 * - A VSCode TextDocument instance.
 */
function createTextDocument(filePath: string, languageId: string, text: string): TextDocument {
  return TextDocument.create(
    pathToFileURL(filePath).href,
    languageId,
    DEFAULT_DOCUMENT_VERSION,
    text,
  )
}
