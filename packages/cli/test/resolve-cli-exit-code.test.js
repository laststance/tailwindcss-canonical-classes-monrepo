import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { resolveCliExitCode } from '../dist/utils/resolve-cli-exit-code.js'

describe('resolveCliExitCode', () => {
  test('exits with 1 when --check finds files that would be rewritten', () => {
    // Arrange
    const input = { writeMode: 'check', changed: 1, errors: 0 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 1)
  })

  test('exits with 0 when --check finds no files that would be rewritten', () => {
    // Arrange
    const input = { writeMode: 'check', changed: 0, errors: 0 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 0)
  })

  test('exits with 0 when write mode rewrites files successfully', () => {
    // Arrange
    const input = { writeMode: 'write', changed: 2, errors: 0 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 0)
  })

  test('exits with 1 when any file processing error occurred', () => {
    // Arrange
    const input = { writeMode: 'check', changed: 0, errors: 1 }

    // Act
    const exitCode = resolveCliExitCode(input)

    // Assert
    assert.equal(exitCode, 1)
  })
})
