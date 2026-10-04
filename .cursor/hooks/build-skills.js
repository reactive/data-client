/* global require */
// Regenerates agent skill references after a docs or skill edit (Cursor
// afterFileEdit, Claude Code PostToolUse), so the CI drift check doesn't fail later.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const input = fs.readFileSync(0, 'utf8').trim();
if (!input) process.exit(0);

let payload;
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = payload.file_path ?? payload.tool_input?.file_path;
if (!filePath) process.exit(0);

const projectDir =
  process.env.CURSOR_PROJECT_DIR ||
  process.env.CLAUDE_PROJECT_DIR ||
  process.cwd();
const relative = path.relative(
  path.resolve(projectDir),
  path.resolve(filePath),
);

/** Every skill's references.json */
function manifests() {
  const skills = path.join(projectDir, '.agents/skills');
  return fs
    .readdirSync(skills)
    .map(skill => path.join(skills, skill, 'references.json'))
    .filter(manifest => fs.existsSync(manifest))
    .map(manifest => JSON.parse(fs.readFileSync(manifest, 'utf8')));
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

if (
  !isSkillDoc(relative) &&
  !isSkillSource(relative) &&
  !relative.startsWith('website/framework-docs/')
)
  process.exit(0);

try {
  execFileSync('node', ['website/framework-docs/skillReferences.mjs'], {
    cwd: projectDir,
    stdio: 'ignore',
  });
} catch {
  // CI reports anything left stale; don't block the agent loop.
}

process.exit(0);
