#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import minimist from 'minimist'
import { glob } from 'tinyglobby'
import {
  getDesignSystem,
  canonicalizeDocument,
  isSupportedExtension,
} from '@tailwindcss-canonical/core'

const CLI_NAME = 'tailwind-suggest-canonical'
const EXIT_SUCCESS = 0
const EXIT_FAILURE = 1

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

type FileResultStatus = 'changed' | 'unchanged' | 'skipped' | 'error'

type FileResult = {
  filePath: string
  status: FileResultStatus
  editCount: number
  message?: string
}

void main()

/**
 * Run the CLI end-to-end.
 * @returns
 * - Resolves when the process finishes successfully.
 * - Rejects if a fatal error prevents processing.
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

  const designSystem = await getDesignSystem(args.rootDir, args.cssPath)

  if (!designSystem?.canonicalizeCandidates) {
    console.error('Tailwind v4 design system was not detected. Canonicalization is unavailable.')
    process.exit(EXIT_FAILURE)
  }

  const results: FileResult[] = []
  for (const filePath of targets) {
    results.push(await processFile(filePath, designSystem, args))
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
 */
function normalizeRootFontSize(value: unknown): number {
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }
  return 16
}

/**
 * Build a short help string for the CLI.
 * @returns
 * - A human-readable usage string.
 */
function buildUsage(): string {
  return [
    `${CLI_NAME} <files/globs> [options]`,
    '',
    'Options:',
    '  --root <dir>             Project root directory (default: cwd)',
    '  --css <file>             Tailwind v4 entry CSS (default: @import "tailwindcss")',
    '  --root-font-size <num>   Root font size in px (default: 16)',
    '  --check                  Dry run (no writes)',
    '  --dry-run                Alias for --check',
    '  --verbose                Print per-file results',
    '  --help                   Show this help',
    '',
    'Examples:',
    `  ${CLI_NAME} "src/**/*.{html,tsx}"`,
    `  ${CLI_NAME} "**/*.svelte" --check`,
  ].join('\n')
}

/**
 * Resolve CLI targets into absolute file paths.
 * @param targets - File paths or glob patterns.
 * @param rootDir - Root directory for glob resolution.
 * @returns
 * - A de-duplicated list of absolute file paths.
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
    if (!isSupportedExtension(filePath)) {
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
 * Process a single file and apply canonical class edits.
 * @param filePath - Absolute path to the target file.
 * @param designSystem - Loaded Tailwind design system.
 * @param args - CLI arguments.
 * @returns
 * - A result summary describing the outcome.
 */
async function processFile(
  filePath: string,
  designSystem: Awaited<ReturnType<typeof getDesignSystem>>,
  args: CliArgs,
): Promise<FileResult> {
  try {
    const text = await fs.readFile(filePath, 'utf8')

    const nextText = await canonicalizeDocument(text, filePath, designSystem, args.rootDir, {
      rootFontSize: args.rootFontSize,
    })

    if (nextText === text) {
      return { filePath, status: 'unchanged', editCount: 0 }
    }

    // Count changes (simple heuristic: count class attribute changes)
    const editCount = countChanges(text, nextText)

    if (args.writeMode === 'write') {
      await fs.writeFile(filePath, nextText, 'utf8')
    }

    return { filePath, status: 'changed', editCount }
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
 * Count approximate number of changes between two texts.
 */
function countChanges(original: string, modified: string): number {
  // Simple line-based diff count
  const originalLines = original.split('\n')
  const modifiedLines = modified.split('\n')
  let changes = 0
  const maxLen = Math.max(originalLines.length, modifiedLines.length)
  for (let i = 0; i < maxLen; i++) {
    if (originalLines[i] !== modifiedLines[i]) {
      changes++
    }
  }
  return changes
}

/**
 * Summarize processing results for reporting.
 * @param results - Per-file results.
 * @returns
 * - Counts for each result status.
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
    }
  }

  return { changed, unchanged, skipped, errors }
}
