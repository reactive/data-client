/* global require */
// Regenerates agent skill references once at the end of an agent turn (Cursor
// `stop`, Claude Code `Stop`) when the turn touched their inputs, so the CI
// drift check doesn't fail later. Generation takes seconds, so it never runs
// per edit, and turns that touched no inputs cost one `git status`.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const input = fs.readFileSync(0, 'utf8').trim();
let payload = {};
try {
  payload = JSON.parse(input || '{}');
} catch {
  // run anyway; the payload only guards against loops
}
// Claude Code: we already sent the agent back once this stop
if (payload.stop_hook_active) process.exit(0);

const projectDir =
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();
const git = (...args) =>
  execFileSync('git', args, { cwd: projectDir, encoding: 'utf8' });
const stampFile = path.join(
  projectDir,
  'node_modules/.cache/build-skills.json',
);

let stamp = {};
try {
  stamp = JSON.parse(fs.readFileSync(stampFile, 'utf8'));
} catch {
  // first run
}

let manifestCache;
/** Every skill's references.json */
function manifests() {
  if (!manifestCache) {
    const skills = path.join(projectDir, '.agents/skills');
    manifestCache = fs
      .readdirSync(skills)
      .map(skill => path.join(skills, skill, 'references.json'))
      .filter(manifest => fs.existsSync(manifest))
      .map(manifest => JSON.parse(fs.readFileSync(manifest, 'utf8')));
  }
  return manifestCache;
}

/** Docs some skill renders; partials (`_foo.mdx`) may be inlined anywhere */
function isSkillDoc(file) {
  if (!/^docs\/.*\.mdx?$/.test(file)) return false;
  if (path.basename(file).startsWith('_')) return true;
  const page = file.replace(/\.(react|vue)(\.mdx?)$/, '$2');
  return manifests().some(({ docs }) => Object.values(docs).includes(page));
}

/** Manifests, or files of a skill another skill bundles */
function isSkillSource(file) {
  const [, skill, rest] = file.match(/^\.agents\/skills\/([^/]+)\/(.+)$/) ?? [];
  if (!skill) return false;
  if (rest === 'references.json') return true;
  return manifests().some(({ skills = [] }) => skills.includes(skill));
}
const isInput = file =>
  isSkillDoc(file) ||
  isSkillSource(file) ||
  file.startsWith('website/framework-docs/') ||
  // symlinked into skills that others bundle
  file.startsWith('website/static/codemods/');

let head, changed;
try {
  head = git('rev-parse', 'HEAD').trim();
  changed = git('status', '--porcelain', '--untracked-files=all')
    .split('\n')
    .filter(Boolean)
    .map(line => line.slice(3).replace(/^.* -> /, ''));
  // inputs committed during the turn no longer show in status
  if (stamp.head && stamp.head !== head)
    changed.push(...git('diff', '--name-only', stamp.head, head).split('\n'));
} catch {
  process.exit(0);
}

const inputs = [...new Set(changed.filter(isInput))].sort();
// skip when the inputs are unchanged since the last run (e.g. a docs edit
// still uncommitted many turns later)
const fingerprint = inputs
  .map(file => {
    const stat = fs.statSync(path.join(projectDir, file), {
      throwIfNoEntry: false,
    });
    return `${file}:${stat ? `${stat.mtimeMs}:${stat.size}` : 'deleted'}`;
  })
  .join('\n');
const fresh = fingerprint !== stamp.fingerprint || head !== stamp.head;
try {
  fs.mkdirSync(path.dirname(stampFile), { recursive: true });
  fs.writeFileSync(stampFile, JSON.stringify({ head, fingerprint }));
} catch {
  // no cache dir; we'll just regenerate again next time
}
if (!inputs.length || !fresh) process.exit(0);

let updated = 0;
try {
  const out = execFileSync(
    'node',
    ['website/framework-docs/skillReferences.mjs'],
    { cwd: projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  updated = Number(out.match(/Updated (\d+)/)?.[1] ?? 0);
} catch {
  // CI reports anything left stale; don't block the agent loop
  process.exit(0);
}
if (!updated) process.exit(0);

// tell the agent, so the regenerated files land in the same commit
const message = `Regenerated ${updated} skill reference file(s) in .agents/skills/*/references from your docs or skill changes. Include them with those changes (commit them if you already committed the docs).`;
console.log(
  JSON.stringify(
    payload.hook_event_name === 'Stop' ?
      { decision: 'block', reason: message }
    : { followup_message: message },
  ),
);
process.exit(0);
