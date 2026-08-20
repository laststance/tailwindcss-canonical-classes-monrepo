import { EXIT_FAILURE, EXIT_SUCCESS } from '../constants.js'

type CliWriteMode = 'write' | 'check'

type ResolveCliExitCodeInput = {
  writeMode: CliWriteMode
  changed: number
  errors: number
}

/**
 * Choose the process exit code after every target file has been processed.
 * `--check` / `--dry-run` must fail when any file still contains non-canonical
 * classes so CI can treat the command like `prettier --check`.
 * Called from `main()` once file results have been summarized.
 * @returns `0` when the run succeeded, `1` when the process should fail
 * @example
 * resolveCliExitCode({ writeMode: 'check', changed: 1, errors: 0 }) // 1
 */
export function resolveCliExitCode(input: ResolveCliExitCodeInput): number {
  // File-read/parse failures always fail the run.
  if (input.errors > 0) {
    return EXIT_FAILURE
  }

  // Check mode reports files that would be rewritten; CI must see that as failure.
  if (input.writeMode === 'check' && input.changed > 0) {
    return EXIT_FAILURE
  }

  return EXIT_SUCCESS
}
