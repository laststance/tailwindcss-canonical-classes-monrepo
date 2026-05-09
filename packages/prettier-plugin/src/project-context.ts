import path from 'node:path'
import prettier, { type ParserOptions } from 'prettier'
import type { PluginOptions } from './options.js'

const prettierConfigDirCache = new Map<string, string | null>()

export type CanonicalProjectContext = {
  projectRoot: string
  stylesheetPath: string | null
}

/**
 * Resolve the project context used by Tailwind canonicalization.
 * @param options - Prettier parser options and plugin options.
 * @param fallbackFilePath - Virtual file path used when Prettier has no filepath.
 * @returns
 * - `projectRoot`: directory used as the base for relative stylesheet paths.
 * - `stylesheetPath`: stylesheet option passed through to the core loader.
 * @example
 * resolveCanonicalProjectContext(options, 'untitled.tsx')
 * // => { projectRoot: '/app', stylesheetPath: './app/globals.css' }
 */
export async function resolveCanonicalProjectContext(
  options: ParserOptions & PluginOptions,
  fallbackFilePath: string,
): Promise<CanonicalProjectContext> {
  const cwd = process.cwd()
  const filePath = options.filepath ?? fallbackFilePath
  const inputDir = options.filepath ? path.dirname(options.filepath) : cwd
  const stylesheetPath = options.tailwindcssCanonicalStylesheet ?? null
  const projectRoot =
    stylesheetPath && !path.isAbsolute(stylesheetPath)
      ? await resolvePrettierConfigDir(filePath, inputDir)
      : cwd

  return {
    projectRoot,
    stylesheetPath,
  }
}

/**
 * Resolve the directory containing the nearest Prettier configuration file.
 * @param filePath - File path Prettier is formatting.
 * @param inputDir - Directory used as the cache key.
 * @returns
 * - The nearest Prettier config directory when found.
 * - The current working directory when no config file exists or resolution fails.
 * @example
 * resolvePrettierConfigDir('/app/src/page.tsx', '/app/src')
 * // => '/app'
 */
async function resolvePrettierConfigDir(filePath: string, inputDir: string): Promise<string> {
  const cached = prettierConfigDirCache.get(inputDir)
  if (cached !== undefined) {
    return cached ?? process.cwd()
  }

  try {
    const prettierConfig = await prettier.resolveConfigFile(filePath)
    if (prettierConfig) {
      const configDir = path.dirname(prettierConfig)
      prettierConfigDirCache.set(inputDir, configDir)
      return configDir
    }
  } catch (error) {
    if (process.env.DEBUG) {
      console.warn('[prettier-plugin-tailwindcss-canonical-classes]', error)
    }
  }

  prettierConfigDirCache.set(inputDir, null)
  return process.cwd()
}
