/**
 * install.js — installs the pre-commit git hook
 *
 * Run once from the repo root:
 *   node scripts/hooks/install.js
 *
 * What it does:
 *   - Copies scripts/hooks/pre-commit → .git/hooks/pre-commit
 *   - Sets execute permission (chmod +x equivalent via fs on Windows)
 *   - Backs up any existing .git/hooks/pre-commit to .git/hooks/pre-commit.bak
 */

const fs   = require('fs')
const path = require('path')

const REPO   = path.resolve(__dirname, '../..')
const SRC    = path.join(REPO, 'scripts/hooks/pre-commit')
const DEST   = path.join(REPO, '.git/hooks/pre-commit')
const BACKUP = DEST + '.bak'

if (!fs.existsSync(path.join(REPO, '.git'))) {
  console.error('Error: not a git repository. Run from the project root.')
  process.exit(1)
}

if (fs.existsSync(DEST)) {
  fs.copyFileSync(DEST, BACKUP)
  console.log('Backed up existing hook →', BACKUP)
}

fs.copyFileSync(SRC, DEST)

// Set executable bit on Linux/Mac; no-op on Windows (Git for Windows handles it)
try { fs.chmodSync(DEST, 0o755) } catch { /* Windows — skip */ }

console.log('Installed: .git/hooks/pre-commit')
console.log('Commits that stage .ts/.tsx/.sql files without updating CHANGELOG.md will now be blocked.')
