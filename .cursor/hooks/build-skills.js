/* global require */
// Regenerates agent skill references after a docs edit (Cursor afterFileEdit,
// Claude Code PostToolUse), so the CI drift check doesn't fail later.
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

/** Docs some skill renders; partials (`_foo.mdx`) may be inlined anywhere */
function isSkillDoc(file) {
  if (!/^docs\/.*\.mdx?$/.test(file)) return false;
  if (path.basename(file).startsWith('_')) return true;
  const page = file.replace(/\.(react|vue)(\.mdx?)$/, '$2');
  const skills = path.join(projectDir, '.agents/skills');
  return fs.readdirSync(skills).some(skill => {
    const manifest = path.join(skills, skill, 'references.json');
    return (
      fs.existsSync(manifest) &&
      Object.values(
        JSON.parse(fs.readFileSync(manifest, 'utf8')).docs,
      ).includes(page)
    );
  });
}

if (
  !isSkillDoc(relative) &&
  !/^\.agents\/skills\/[^/]+\/references\.json$/.test(relative) &&
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
