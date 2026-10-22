'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const cli = path.join(__dirname, '../cli.js');
const ignored = ['node_modules/dep', 'packages/app/node_modules/dep'];
const before = `import { Entity } from '@data-client/rest';
class MySchema {
  denormalize(input: {}, args: readonly any[], unvisit: any) {
    return unvisit(this.schema, input);
  }
}
`;

function run(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

describe('cli', () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-client-codemods-'));
    for (const folder of ['src', ...ignored]) {
      fs.mkdirSync(path.join(dir, folder), { recursive: true });
      fs.writeFileSync(path.join(dir, folder, 'schema.ts'), before);
    }
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('lists the codemods when none is named', () => {
    const { status, stderr } = run([], dir);
    expect(status).toBe(1);
    expect(stderr).toContain('Codemods: axios-to-rest, v0.15, v0.16, v0.18');
  });

  it('rejects an unknown codemod', () => {
    const { status, stderr } = run(['v0.1', 'src'], dir);
    expect(status).toBe(1);
    expect(stderr).toContain('Unknown codemod "v0.1"');
  });

  it('transforms TypeScript sources and skips node_modules', () => {
    const { status } = run(['v0.18', '.', '--run-in-band', '--silent'], dir);
    expect(status).toBe(0);
    expect(fs.readFileSync(path.join(dir, 'src/schema.ts'), 'utf8')).not.toBe(
      before,
    );
    for (const folder of ignored) {
      expect(fs.readFileSync(path.join(dir, folder, 'schema.ts'), 'utf8')).toBe(
        before,
      );
    }
  });
});
