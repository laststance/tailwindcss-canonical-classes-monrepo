import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveCliExitCode } from '../dist/utils/resolve-cli-exit-code.js'

type ResolveCliExitCodeInput = Parameters<typeof resolveCliExitCode>[0]

describe('resolveCliExitCode', () => {
  it('exits with 1 when --check finds files that would be rewritten', () => {
    // Arrange
    const input: ResolveCliExitCodeInput = { writeMode: 'check', changed: 1, errors: 0 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 1)
  })

  it('exits with 0 when --check finds no files that would be rewritten', () => {
    // Arrange
    const input: ResolveCliExitCodeInput = { writeMode: 'check', changed: 0, errors: 0 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 0)
  })

  it('exits with 0 when write mode rewrites files successfully', () => {
    // Arrange
    const input: ResolveCliExitCodeInput = { writeMode: 'write', changed: 2, errors: 0 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 0)
  })

  it('exits with 1 when any file processing error occurred', () => {
    // Arrange
    const input: ResolveCliExitCodeInput = { writeMode: 'check', changed: 0, errors: 1 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 1)
  })
})
