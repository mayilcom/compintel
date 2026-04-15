/**
 * pre-compact.js — PreCompact hook
 *
 * Fires just before Claude Code compacts the context window.
 * Checks git diff for uncommitted source file changes and injects a
 * mandatory documentation reminder so it survives into the compacted context.
 *
 * If source files changed but docs/changelog/CHANGELOG.md was NOT modified
 * this session, emits a high-urgency additionalContext block listing every
 * changed file and demanding the update before compaction squashes the work.
 */

const { execSync } = require('child_process')

const REPO = 'C:/Users/beemy/Mayil'
const CODE_EXT = /\.(ts|tsx|sql|css|js|jsx)$/
const SKIP = [/[/\\]\.claude[/\\]/, /node_modules/, /\.next[/\\]/, /\.git[/\\]/]

function gitLines(cmd) {
  try {
    return execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
      .trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

let raw = ''
process.stdin.on('data', c => { raw += c })
process.stdin.on('end', () => {
  try {
    // Collect all changed files: unstaged + staged vs HEAD
    const unstaged = gitLines('git diff --name-only HEAD')
    const staged   = gitLines('git diff --name-only --cached')
    const allChanged = [...new Set([...unstaged, ...staged])]

    // Filter to source code files only
    const sourceFiles = allChanged.filter(f =>
      CODE_EXT.test(f) && !SKIP.some(p => p.test(f))
    )

    // Check if CHANGELOG was touched in this diff
    const changelogTouched = allChanged.some(f => /CHANGELOG/i.test(f))

    if (sourceFiles.length === 0) {
      // Nothing uncommitted — no reminder needed
      process.exit(0)
    }

    const fileList = sourceFiles.map(f => `  • ${f}`).join('\n')

    let message =
      '[pre-compact] Context is about to be compacted. ' +
      `${sourceFiles.length} source file(s) have uncommitted changes:\n` +
      fileList + '\n\n'

    if (!changelogTouched) {
      message +=
        'CHANGELOG.md has NOT been updated this session.\n' +
        'Before compaction: update docs/changelog/CHANGELOG.md with every ' +
        'change made above. Also check CLAUDE.md project structure if new ' +
        'files were added, and update any relevant docs/architecture/ files.\n' +
        'Do this NOW — this context will be lost after compaction.'
    } else {
      message +=
        'CHANGELOG.md was updated. Verify it captures all the source changes ' +
        'listed above and that CLAUDE.md / docs/architecture/ are also current.'
    }

    const out = {
      hookSpecificOutput: {
        hookEventName: 'PreCompact',
        additionalContext: message,
      },
    }

    process.stdout.write(JSON.stringify(out))
  } catch {
    // Never block Claude on hook errors
    process.exit(0)
  }
})
