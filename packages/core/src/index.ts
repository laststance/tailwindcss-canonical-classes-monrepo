// Types
export type { DesignSystem, TextEdit, CanonicalizeOptions } from './types.js'

// Design system loading
export {
  getDesignSystem,
  loadTailwindDesignSystem,
  clearDesignSystemCache,
} from './design-system.js'

// Canonicalization
export {
  canonicalizeDocument,
  createLanguageServiceState,
  createSettings,
  buildCanonicalEdits,
  applyTextEdits,
  dedupeEdits,
  inferLanguageId,
  isSupportedExtension,
} from './canonicalizer.js'

// Re-export useful types from language-service
export { DiagnosticKind, isSuggestCanonicalClasses } from '@tailwindcss/language-service'
