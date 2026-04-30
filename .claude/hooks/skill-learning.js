/**
 * skill-learning.js — PostToolUse hook
 *
 * After Claude edits a file, checks whether the change touches a "law-of-the-land"
 * file that one or more skills duplicate from. If so, injects a reminder to
 * review the relevant SKILL.md files before this turn ends.
 *
 * Skill files live at .claude/skills/<name>/SKILL.md.
 *
 * Skips: .claude/ (don't loop on skill edits), node_modules, .next, build outputs.
 *
 * The hook fires only on a curated list of high-signal files — the source-of-truth
 * files that skills duplicate state from. Everyday marketing copy edits do NOT
 * trigger it (too noisy); only changes to design tokens, plan limits, pricing,
 * UI components, content templates, CHANGELOG, and ADRs.
 */

const SKIP_PATTERNS = [
  /[/\\]\.claude[/\\]/,        // editing skills themselves
  /[/\\]node_modules[/\\]/,
  /[/\\]\.next[/\\]/,
  /[/\\]dist[/\\]/,
  /[/\\]\.git[/\\]/,
];

/**
 * Map of source-of-truth file patterns to the skill(s) that duplicate them.
 * When one of these files changes, the named skills should be reviewed for
 * stale references and new patterns to capture.
 */
const SKILL_MAP = [
  {
    patterns: [/[/\\]src[/\\]lib[/\\]utils\.ts$/],
    skills:   ['ab-variant', 'competitor-brief', 'copy-audit', 'copywriter', 'email-campaign', 'paid-ads'],
    reason:   'PLAN_LIMITS, plan tier names, or pricing logic',
  },
  {
    patterns: [/[/\\]src[/\\]app[/\\]\(marketing\)[/\\]pricing[/\\]/],
    skills:   ['ab-variant', 'competitor-brief', 'copy-audit', 'copywriter', 'email-campaign', 'paid-ads'],
    reason:   'USD prices, plan features, FAQ, enterprise positioning on the live pricing page',
  },
  {
    patterns: [/[/\\]src[/\\]app[/\\]globals\.css$/, /tailwind\.config/],
    skills:   ['web-design'],
    reason:   'design tokens, fonts, or Tailwind extensions',
  },
  {
    patterns: [/[/\\]src[/\\]components[/\\]ui[/\\]/],
    skills:   ['web-design'],
    reason:   'shared UI component (Button, Badge, Card, etc.)',
  },
  {
    patterns: [/[/\\]src[/\\]components[/\\]marketing-nav/, /[/\\]src[/\\]app[/\\]\(marketing\)[/\\]layout/],
    skills:   ['copy-audit', 'web-design'],
    reason:   'marketing nav structure or layout shell',
  },
  {
    patterns: [/[/\\]apps[/\\]emails[/\\]/],
    skills:   ['copywriter', 'email-campaign', 'newsletter'],
    reason:   'email template structure or copy',
  },
  {
    patterns: [/[/\\]content[/\\]blog[/\\]/],
    skills:   ['content-strategy', 'new-blog-post', 'seo'],
    reason:   'blog inventory or post format',
  },
  {
    patterns: [/[/\\]content[/\\]case-studies[/\\]/],
    skills:   ['content-strategy', 'new-case-study'],
    reason:   'case study inventory or format',
  },
  {
    patterns: [/[/\\]content[/\\]use-cases[/\\]/],
    skills:   ['content-strategy', 'copywriter'],
    reason:   'use case inventory',
  },
  {
    patterns: [/[/\\]docs[/\\]changelog[/\\]CHANGELOG\.md$/],
    skills:   ['content-strategy', 'newsletter', 'pr', 'social'],
    reason:   'newly shipped features may be worth surfacing in newsletter / social / PR',
  },
  {
    patterns: [/[/\\]docs[/\\]decisions[/\\]ADR-/],
    skills:   ['competitor-brief', 'content-strategy', 'pr', 'web-design'],
    reason:   'a new architectural decision may affect positioning, content strategy, or design',
  },
  {
    patterns: [/[/\\]src[/\\]app[/\\]sitemap\./, /[/\\]src[/\\]app[/\\]robots\./],
    skills:   ['meta-check', 'seo'],
    reason:   'sitemap or robots config — affects SEO surface',
  },
];

let raw = '';
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const filePath = (payload.tool_input || {}).file_path
                  || (payload.tool_input || {}).filePath
                  || '';
    if (!filePath) process.exit(0);

    if (SKIP_PATTERNS.some(p => p.test(filePath))) process.exit(0);

    // Find every skill mapping that matches this file.
    const matched = SKILL_MAP.filter(({ patterns }) =>
      patterns.some(p => p.test(filePath))
    );
    if (matched.length === 0) process.exit(0);

    // Aggregate skills (deduped, sorted) and reasons across all matches.
    const skills  = [...new Set(matched.flatMap(m => m.skills))].sort();
    const reasons = [...new Set(matched.map(m => m.reason))];

    // Produce a relative path for the message.
    const rel = filePath
      .replace(/.*[/\\]Mayil[/\\]/, '')
      .replace(/\\/g, '/');

    const skillsList  = skills.map(s => '`' + s + '`').join(', ');
    const reasonsList = reasons.join('; ');

    const out = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          '[skill-learning] ' + rel + ' was just modified (' + reasonsList + '). ' +
          'Before this turn ends, check whether ' + skillsList +
          ' need updating at .claude/skills/<name>/SKILL.md — ' +
          'remove any references this change made stale, and add any new pattern ' +
          'worth accumulating for future sessions. ' +
          'If nothing skill-relevant changed, ignore this nudge.',
      },
    };

    process.stdout.write(JSON.stringify(out));
  } catch (_) {
    // Never block Claude on hook errors.
    process.exit(0);
  }
});
