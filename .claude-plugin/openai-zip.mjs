// Packs the `data-client` plugin as the ZIP OpenAI's plugin directory
// (ChatGPT and Codex) uploads: node .claude-plugin/openai-zip.mjs [out.zip]
// The directory takes a Claude plugin archive with each skill at
// skills/<name>/SKILL.md, and doesn't follow the repo, so upload a new ZIP
// whenever the plugin's skills change.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { pluginDirFiles, root } from './plugin-dir.mjs';

const skills = path.join(root, '.agents/skills');
const out = path.resolve(process.argv[2] ?? 'data-client-plugin.zip');
const manifest = pluginDirFiles()['.agents/skills/.claude-plugin/plugin.json'];
// OpenAI requires a semver `version` that grows with each upload: the UTC
// date and time of the build. The repo's manifest has none so Claude Code
// updates on every commit.
const [date, time] = new Date().toISOString().replace(/[-:]/g, '').split('T');
const version = `1.${date}.${Number(time.slice(0, 6))}`;
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'data-client-plugin-'));

try {
  for (const skill of manifest.skills)
    fs.cpSync(path.join(skills, skill), path.join(stage, 'skills', skill), {
      recursive: true,
      dereference: true,
      // repo tooling, left out like scripts/pack-skills.mjs does
      filter: src => !['evals', 'references.json'].includes(path.basename(src)),
    });
  for (const file of ['README.md', manifest.icon])
    fs.cpSync(path.join(skills, file), path.join(stage, file));
  fs.cpSync(path.join(root, 'LICENSE'), path.join(stage, 'LICENSE'));
  fs.mkdirSync(path.join(stage, '.claude-plugin'));
  fs.writeFileSync(
    path.join(stage, '.claude-plugin/plugin.json'),
    `${JSON.stringify({ ...manifest, version, skills: './skills/' }, null, 2)}\n`,
  );

  fs.rmSync(out, { force: true });
  // needs the zip CLI
  execFileSync('zip', ['-qrX', out, '.'], { cwd: stage });
} finally {
  fs.rmSync(stage, { recursive: true });
}
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
