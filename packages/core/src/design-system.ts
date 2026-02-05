import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createJiti } from 'jiti'
import type { DesignSystem } from './types.js'

const DEFAULT_TAILWIND_CSS = '@import "tailwindcss";'

/** Cache for loaded design systems keyed by resolved CSS path */
const designSystemCache = new Map<string, Promise<DesignSystem>>()

/**
 * Get or load a cached Tailwind design system.
 * @param rootDir - Project root directory.
 * @param cssPath - Optional CSS entry file path.
 * @returns
 * - Cached or newly loaded design system.
 * - Throws if Tailwind v4 is unavailable.
 * @example
 * const ds = await getDesignSystem('/project', './app/globals.css')
 */
export async function getDesignSystem(
  rootDir: string,
  cssPath: string | null = null,
): Promise<DesignSystem> {
  const resolvedPath = cssPath ? path.resolve(rootDir, cssPath) : null
  const cacheKey = resolvedPath ?? `default:${rootDir}`

  if (!designSystemCache.has(cacheKey)) {
    designSystemCache.set(cacheKey, loadTailwindDesignSystem(rootDir, cssPath))
  }

  return designSystemCache.get(cacheKey)!
}

/**
 * Clear the design system cache.
 * Useful for testing or when config changes.
 */
export function clearDesignSystemCache(): void {
  designSystemCache.clear()
}

/**
 * Load the Tailwind v4 design system used for canonicalization.
 * @param rootDir - Project root directory.
 * @param cssPath - Optional CSS entry file.
 * @returns
 * - A Tailwind design system when v4 is available.
 * - Throws when v4 APIs are unavailable.
 * @example
 * const designSystem = await loadTailwindDesignSystem(process.cwd(), null)
 */
export async function loadTailwindDesignSystem(
  rootDir: string,
  cssPath: string | null,
): Promise<DesignSystem> {
  const tailwindModule = await import('tailwindcss')
  const loadDesignSystem =
    (tailwindModule as any).__unstable__loadDesignSystem ??
    (tailwindModule as any).default?.__unstable__loadDesignSystem

  if (typeof loadDesignSystem !== 'function') {
    throw new Error('Tailwind CSS v4 is required. __unstable__loadDesignSystem not found.')
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
 */
function fallbackModule(resourceType: string): unknown {
  if (resourceType === 'plugin') {
    return () => {}
  }
  return {}
}
