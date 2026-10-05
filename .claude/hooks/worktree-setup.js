/* global require */
// Claude Code twin of Cursor's `.cursor/worktrees.json`: when a session starts
// in a fresh git worktree (`claude --worktree`), runs its `setup-worktree`
// commands. Anywhere else this is one stat per session start.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
// written only once every command succeeds, so a failed setup reruns
const done = path.join(projectDir, 'node_modules/.worktree-setup-done');
// a linked worktree has a `.git` file; the main checkout has a directory
const isWorktree = fs
  .statSync(path.join(projectDir, '.git'), {
    throwIfNoEntry: false,
  })
  ?.isFile();
if (!isWorktree || fs.existsSync(done)) process.exit(0);

const commands =
  JSON.parse(
    fs.readFileSync(path.join(projectDir, '.cursor/worktrees.json'), 'utf8'),
  )['setup-worktree'] ?? [];
for (const command of commands) {
  try {
    execSync(command, { cwd: projectDir, stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    // stdout becomes session context, so the agent knows setup is incomplete
    console.log(
      `Worktree setup failed at \`${command}\`:\n${String(err.stderr).slice(-2000)}`,
    );
    process.exit(0);
  }
}
fs.mkdirSync(path.dirname(done), { recursive: true });
fs.writeFileSync(done, '');
console.log(`Worktree set up: ${commands.join(' && ')}`);
