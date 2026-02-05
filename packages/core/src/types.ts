/**
 * Design system interface from Tailwind v4.
 * Contains canonicalization capabilities.
 */
export type DesignSystem = {
  canonicalizeCandidates?: (classes: string[], options?: { rem?: number }) => string[]
  invalidCandidates?: Set<string>
}

/**
 * Text edit representing a single replacement operation.
 */
export type TextEdit = {
  startOffset: number
  endOffset: number
  replacement: string
  original: string
}

/**
 * Options for canonicalization.
 */
export type CanonicalizeOptions = {
  rootFontSize?: number
}
