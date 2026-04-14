/**
 * auto-doc.js — PostToolUse hook
 *
 * After Claude edits a source file, injects an additionalContext reminder
 * to update docs/changelog/CHANGELOG.md and the relevant architecture doc.
 *
 * Skips: changelog itself, docs/, MEMORY files, .claude/, settings files,
 *        and non-code file types (.md, .json, .env, etc.)
 */

const SKIP_PATTERNS = [
  /changelog/i,
  /CHANGELOG/,
  /MEMORY/,
  /[/\\]\.claude[/\\]/,
  /settings\.json/,
  /settings\.local\.json/,
  /[/\\]docs[/\\]/,
  /\.env/,
  /package\.json/,
  /package-lock\.json/,
];

const CODE_EXTENSIONS = /\.(ts|tsx|sql|css|js|jsx)$/;

/**
 * Map file path patterns to the architecture doc(s) most likely to need updating.
 */
const DOC_MAP = [
  {
    patterns: [/[/\\]api[/\\]checkout/, /[/\\]upgrade[/\\]/, /razorpay/, /stripe/],
    doc: 'docs/architecture/payment-flow.md',
  },
  {
    patterns: [/[/\\]proxy\.ts/, /[/\\]api[/\\]webhooks[/\\]clerk/, /[/\\]onboarding[/\\]/],
    doc: 'docs/architecture/auth-flow.md',
  },
  {
    patterns: [/supabase[/\\]migrations/, /database.*schema/, /schema.*sql/],
    doc: 'docs/architecture/database-schema.md',
  },
  {
    patterns: [/apps[/\\]workers/, /[/\\]collector/, /[/\\]differ/, /[/\\]signal/, /[/\\]assembler/, /[/\\]delivery/],
    doc: 'docs/architecture/data-pipeline.md',
  },
  {
    patterns: [/[/\\]api[/\\]/, /[/\\]lib[/\\]supabase/, /apify/, /resend/, /clerk/, /anthropic/, /openai/],
    doc: 'docs/architecture/api-integrations.md',
  },
  {
    patterns: [/[/\\]components[/\\]ui[/\\]/, /[/\\]design.*system/, /tokens/, /tailwind\.config/],
    doc: 'docs/design-system/components.md or docs/design-system/tokens.md',
  },
];

function getRelevantDocs(filePath) {
  const matched = DOC_MAP
    .filter(({ patterns }) => patterns.some(p => p.test(filePath)))
    .map(({ doc }) => doc);
  return [...new Set(matched)];
}

let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const filePath = (payload.tool_input || {}).file_path
                  || (payload.tool_input || {}).filePath
                  || '';

    // Not a code file — do nothing
    if (!filePath || !CODE_EXTENSIONS.test(filePath)) process.exit(0);

    // Skip changelog/docs/memory files
    if (SKIP_PATTERNS.some(p => p.test(filePath))) process.exit(0);

    // Produce a relative path for the message
    const rel = filePath.replace(/.*[/\\]Mayil[/\\]/, '');

    const archDocs = getRelevantDocs(filePath);
    const docsNote = archDocs.length > 0
      ? ' Also check ' + archDocs.join(', ') + ' to see if the architecture description is still accurate.'
      : '';

    const adrNote = /api[/\\]checkout|upgrade[/\\]|payment|auth|supabase[/\\]migrations/.test(filePath)
      ? ' If this reflects a new architectural decision, write an ADR in docs/decisions/ADR-NNN-*.md and add it to docs/README.md.'
      : '';

    const out = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          '[auto-doc] ' + rel + ' was just modified. ' +
          'When you finish all edits this turn, update ' +
          'docs/changelog/CHANGELOG.md — add or extend ' +
          'the current version entry with what changed and why.' +
          docsNote +
          adrNote,
      },
    };

    process.stdout.write(JSON.stringify(out));
  } catch (_) {
    // Never block Claude on hook errors
    process.exit(0);
  }
});
