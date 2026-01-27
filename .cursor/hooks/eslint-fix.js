const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const input = fs.readFileSync(0, 'utf8').trim();
if (!input) process.exit(0);

let payload;
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = payload.file_path;
if (!filePath) process.exit(0);

const projectDir = process.env.CURSOR_PROJECT_DIR || process.cwd();
const normalizedProject = path.resolve(projectDir) + path.sep;
const normalizedFile = path.resolve(filePath);

if (!normalizedFile.startsWith(normalizedProject)) process.exit(0);

const ext = path.extname(normalizedFile);
const allowed = new Set(['.js', '.jsx', '.ts', '.tsx', '.cts', '.mts']);
if (!allowed.has(ext)) process.exit(0);

try {
  execFileSync('yarn', ['eslint', '--fix', '--', normalizedFile], {
    stdio: 'ignore',
  });
} catch {
  // Ignore lint failures to avoid blocking the agent loop.
}

process.exit(0);
