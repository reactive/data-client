// Runs the skill sync against scratch projects, one per install layout:
// node --test 'packages/core/agents/*.test.mjs'
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import zlib from 'node:zlib';

import { PACKAGES, syncSkills } from './skills.mjs';

/** Writes `files` (path -> JSON object or text) under a new project dir */
function project(files) {
  return write(fs.mkdtempSync(path.join(os.tmpdir(), 'dc-skills-')), files);
}

/** Writes `files` (path -> JSON object or text) under `dir` */
function write(dir, files) {
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(
      path.join(dir, file),
      typeof content === 'string' || Buffer.isBuffer(content) ?
        content
      : JSON.stringify(content),
    );
  }
  return dir;
}

/** An installed package at `dir`, shipping `skills` */
function pkg(dir, name, version, skills = [], dependencies = {}) {
  return {
    [`${dir}/package.json`]: { name, version, dependencies },
    ...Object.fromEntries(
      skills.map(skill => [
        `${dir}/skills/${skill}/SKILL.md`,
        `---\nname: ${skill}\ndescription: ${skill} skill. More.\n---\n`,
      ]),
    ),
  };
}

/** A zip of `files` (name -> text), stored (0) or deflated (8) like Yarn's cache */
function zip(files, method) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = Buffer.from(name);
    const data =
      method === 8 ? zlib.deflateRawSync(Buffer.from(text)) : Buffer.from(text);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt16LE(nameBytes.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, nameBytes, data);
    centrals.push(central, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

/** A Yarn PnP project: .pnp.cjs inlines the install map as Yarn writes it */
function pnpProject(packages, files = {}) {
  const sentinel = 'pnp-ran';
  const state = {
    packageRegistryData: [
      [null, [[null, { packageLocation: './' }]]],
      ...packages.map(([name, location]) => [
        name,
        [['npm:0.19.0', { packageLocation: location }]],
      ]),
    ],
  };
  const literal = JSON.stringify(state, null, 2)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\\n');
  const dir = project({
    'package.json': { name: 'app' },
    '.pnp.cjs': `require('fs').writeFileSync(${JSON.stringify(sentinel)}, '');\nconst RAW_RUNTIME_STATE =\n'${literal}';\n`,
    ...files,
  });
  return { dir, ran: () => fs.existsSync(path.join(dir, sentinel)) };
}

/** A Yarn PnP project whose zipped @data-client/react ships `files` */
function zippedReact(version, files, method = 0) {
  const inZip = 'node_modules/@data-client/react/';
  return pnpProject(
    [['@data-client/react', `./.yarn/cache/react.zip/${inZip}`]],
    {
      '.yarn/cache/react.zip': zip(
        {
          [`${inZip}package.json`]: JSON.stringify({ version }),
          ...Object.fromEntries(
            Object.entries(files).map(([name, text]) => [
              `${inZip}${name}`,
              text,
            ]),
          ),
        },
        method,
      ),
    },
  );
}

const skillsDir = dir => path.join(dir, '.claude/skills');
const links = dir =>
  Object.fromEntries(
    fs
      .readdirSync(skillsDir(dir), { withFileTypes: true })
      .filter(entry => entry.isSymbolicLink())
      .map(entry => [
        entry.name,
        fs.readlinkSync(path.join(skillsDir(dir), entry.name)),
      ]),
  );
const skillText = (dir, skill) =>
  fs.readFileSync(path.join(skillsDir(dir), skill, 'SKILL.md'), 'utf8');
const listing = dir => fs.readdirSync(dir, { recursive: true }).sort();

/** react and rest installed flat, with core and endpoint hoisted beside them */
function hoisted() {
  return project({
    'package.json': {
      dependencies: { '@data-client/react': '*', '@data-client/rest': '*' },
    },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
    ...pkg('node_modules/@data-client/rest', '@data-client/rest', '0.19.0', [
      'data-client-rest',
    ]),
    ...pkg('node_modules/@data-client/core', '@data-client/core', '0.19.0', [
      'data-client-manager',
    ]),
  });
}

test('does nothing without Data Client', () => {
  const dir = project({ 'package.json': { name: 'app' } });
  assert.deepEqual(syncSkills(dir), {
    added: [],
    removed: [],
    outdated: [],
    kept: [],
    junctions: false,
    dir: '.agents/skills',
  });
  assert.ok(!fs.existsSync(path.join(dir, '.claude')));
});

test('links each shipped skill through node_modules', () => {
  const dir = hoisted();
  assert.deepEqual(syncSkills(dir).added.sort(), [
    'data-client-manager',
    'data-client-react',
    'data-client-rest',
  ]);
  assert.deepEqual(links(dir), {
    'data-client-manager':
      '../../node_modules/@data-client/core/skills/data-client-manager',
    'data-client-react':
      '../../node_modules/@data-client/react/skills/data-client-react',
    'data-client-rest':
      '../../node_modules/@data-client/rest/skills/data-client-rest',
  });
  assert.match(skillText(dir, 'data-client-react'), /data-client-react skill/);
});

test('shares one folder: .agents/skills, with .claude/skills linking to it', () => {
  const dir = hoisted();
  syncSkills(dir);
  assert.equal(
    fs.readlinkSync(path.join(dir, '.claude/skills')),
    '../.agents/skills',
  );
  assert.ok(
    fs
      .lstatSync(path.join(dir, '.agents/skills/data-client-react'))
      .isSymbolicLink(),
  );
});

test('running again changes nothing', () => {
  const dir = hoisted();
  syncSkills(dir);
  assert.deepEqual(syncSkills(dir), {
    added: [],
    removed: [],
    outdated: [],
    kept: [],
    junctions: false,
    dir: '.agents/skills',
  });
});

test('reports a skill something else holds instead of up to date', () => {
  const dir = hoisted();
  // how git checks out a committed link with core.symlinks=false
  write(dir, {
    '.claude/skills/data-client-react':
      '../../node_modules/@data-client/react/skills/data-client-react',
  });
  assert.deepEqual(syncSkills(dir).kept, ['data-client-react']);
  assert.deepEqual(syncSkills(dir).kept, ['data-client-react']);
});

test('keeps links Windows wrote with backslashes', () => {
  const dir = hoisted();
  syncSkills(dir);
  const file = path.join(dir, '.agents/skills/data-client-react');
  const target = fs.readlinkSync(file);
  fs.unlinkSync(file);
  fs.symlinkSync(target.replaceAll('/', '\\'), file);
  assert.deepEqual(syncSkills(dir).added, []);
});

test('links the skills of every package in .agents/skill-packages.json', () => {
  const map = JSON.parse(
    fs.readFileSync(
      new URL('../../../.agents/skill-packages.json', import.meta.url),
      'utf8',
    ),
  );
  assert.deepEqual([...PACKAGES].sort(), Object.keys(map).sort());
});

test('repairs drift: packages and skills added or removed', () => {
  const dir = hoisted();
  syncSkills(dir);
  fs.rmSync(path.join(dir, 'node_modules/@data-client/rest'), {
    recursive: true,
  });
  const react = path.join(dir, 'node_modules/@data-client/react/skills');
  fs.renameSync(
    path.join(react, 'data-client-react'),
    path.join(react, 'data-client-react-hooks'),
  );
  write(
    dir,
    pkg('node_modules/@data-client/vue', '@data-client/vue', '0.19.0', [
      'data-client-vue',
    ]),
  );
  const { added, removed } = syncSkills(dir);
  assert.deepEqual(added.sort(), [
    'data-client-react-hooks',
    'data-client-vue',
  ]);
  assert.deepEqual(removed.sort(), ['data-client-react', 'data-client-rest']);
});

test("never touches the user's own skills or links", () => {
  const dir = hoisted();
  const own = path.join(skillsDir(dir), 'data-client-react');
  fs.mkdirSync(own, { recursive: true });
  fs.writeFileSync(path.join(own, 'SKILL.md'), 'mine');
  fs.symlinkSync('../../somewhere', path.join(skillsDir(dir), 'other'));
  syncSkills(dir);
  assert.equal(skillText(dir, 'data-client-react'), 'mine');
  assert.equal(links(dir).other, '../../somewhere');
  // a project that keeps skills in a real .claude/skills keeps them there
  assert.ok(links(dir)['data-client-rest']);
  assert.ok(!fs.existsSync(path.join(dir, '.agents')));
  fs.rmSync(path.join(dir, 'node_modules'), { recursive: true });
  syncSkills(dir);
  assert.equal(skillText(dir, 'data-client-react'), 'mine');
  assert.deepEqual(Object.keys(links(dir)), ['other']);
});

test('syncs .agents/skills when a committed .claude/skills links to it', () => {
  const dir = hoisted();
  fs.mkdirSync(path.join(dir, '.agents/skills'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude'));
  fs.symlinkSync('../.agents/skills', path.join(dir, '.claude/skills'));
  syncSkills(dir);
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/data-client-react')));
});

test('syncs .agents/skills when git checked .claude/skills out as a file', () => {
  const dir = hoisted();
  write(dir, { '.claude/skills': '../.agents/skills' });
  assert.deepEqual(syncSkills(dir).added.sort(), [
    'data-client-manager',
    'data-client-react',
    'data-client-rest',
  ]);
  assert.ok(fs.existsSync(path.join(dir, '.agents/skills/data-client-react')));
});

test('accepts a .claude/skills link with an absolute target, like a junction', () => {
  const real = hoisted();
  // reached through a linked parent, so the target string differs
  const dir = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'dc-alias-')),
    'app',
  );
  fs.symlinkSync(real, dir);
  fs.mkdirSync(path.join(real, '.agents/skills'), { recursive: true });
  fs.mkdirSync(path.join(real, '.claude'));
  fs.symlinkSync(
    fs.realpathSync(path.join(real, '.agents/skills')),
    path.join(real, '.claude/skills'),
  );
  assert.equal(syncSkills(dir).dir, '.agents/skills');
  assert.ok(fs.existsSync(path.join(real, '.agents/skills/data-client-react')));
});

test('never writes through any other committed skills link', () => {
  for (const linked of [
    '.claude',
    '.claude/skills',
    '.agents',
    '.agents/skills',
  ]) {
    const dir = hoisted();
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-elsewhere-'));
    fs.mkdirSync(path.dirname(path.join(dir, linked)), { recursive: true });
    fs.symlinkSync(elsewhere, path.join(dir, linked), 'junction');
    syncSkills(dir);
    assert.deepEqual(fs.readdirSync(elsewhere), [], linked);
  }
});

test('packages that predate shipped skills are reported', () => {
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.18.0'),
  });
  assert.deepEqual(syncSkills(dir).outdated, ['@data-client/react@0.18.0']);
});

for (const field of [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
]) {
  test(`strict layout finds endpoint through graphql in ${field}`, () => {
    const dir = project({
      'package.json': { [field]: { '@data-client/graphql': '*' } },
      ...pkg(
        'node_modules/@data-client/graphql',
        '@data-client/graphql',
        '0.19.0',
      ),
      ...pkg(
        'node_modules/@data-client/graphql/node_modules/@data-client/endpoint',
        '@data-client/endpoint',
        '0.19.0',
        ['data-client-schema'],
      ),
    });
    assert.deepEqual(syncSkills(dir), {
      added: ['data-client-schema'],
      removed: [],
      // graphql ships no skills of its own
      outdated: [],
      kept: [],
      junctions: false,
      dir: '.agents/skills',
    });
  });
}

test('pnpm links transitive packages through a direct one, so upgrades follow', () => {
  const store = version =>
    `node_modules/.pnpm/@data-client+react@${version}/node_modules/@data-client`;
  const install = version => ({
    ...pkg(`${store(version)}/react`, '@data-client/react', version, [
      'data-client-react',
    ]),
    ...pkg(`${store(version)}/core`, '@data-client/core', version, [
      'data-client-manager',
    ]),
  });
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...install('0.19.0'),
    ...install('0.19.1'),
  });
  const use = version => {
    const linked = path.join(dir, 'node_modules/@data-client/react');
    fs.rmSync(linked, { force: true });
    fs.mkdirSync(path.dirname(linked), { recursive: true });
    fs.symlinkSync(path.join(dir, store(version), 'react'), linked, 'junction');
  };
  use('0.19.0');
  syncSkills(dir);
  assert.equal(
    links(dir)['data-client-manager'],
    '../../node_modules/@data-client/react/../core/skills/data-client-manager',
  );
  use('0.19.1');
  const text = skill =>
    fs.realpathSync
      .native(path.join(skillsDir(dir), skill))
      .includes('@0.19.1');
  assert.ok(text('data-client-manager') && text('data-client-react'));
  assert.deepEqual(syncSkills(dir).added, []);
});

test('pnpm workspaces, with comments, flow lists and CRLF', () => {
  for (const yaml of [
    'packages:\n  - apps/* # apps\n',
    "packages: ['apps/*']\n",
    'name: x\npackages:\n\n- "apps/*"\n',
    'packages:\r\n  - apps/*\r\n',
  ]) {
    const dir = project({
      'package.json': { name: 'root' },
      'pnpm-workspace.yaml': yaml,
      'apps/web/package.json': { dependencies: { '@data-client/react': '*' } },
      ...pkg(
        'apps/web/node_modules/@data-client/react',
        '@data-client/react',
        '0.19.0',
        ['data-client-react'],
      ),
    });
    syncSkills(dir);
    assert.equal(
      links(dir)['data-client-react'],
      '../../apps/web/node_modules/@data-client/react/skills/data-client-react',
      yaml,
    );
  }
});

/** A workspace app at apps/<name> installing @data-client/react@version */
const app = (name, version) => ({
  [`apps/${name}/package.json`]: {
    dependencies: { '@data-client/react': version },
  },
  ...pkg(
    `apps/${name}/node_modules/@data-client/react`,
    '@data-client/react',
    version,
    ['data-client-react'],
  ),
});

test('workspace exclusions skip their packages', () => {
  const dir = project({
    'package.json': { name: 'root' },
    'pnpm-workspace.yaml': "packages:\n  - 'apps/**'\n  - '!**/fixtures/**'\n",
    ...app('web/fixtures/old', '0.18.0'),
    ...app('web', '0.19.0'),
  });
  syncSkills(dir);
  assert.match(links(dir)['data-client-react'], /^\.\.\/\.\.\/apps\/web\/node/);
});

test('workspaces outside the project are ignored', () => {
  for (const pattern of ['../**', '..\\**', 'packages\\..\\..\\**']) {
    const dir = project({
      'app/package.json': { workspaces: [pattern] },
      ...app('../sibling', '0.19.0'),
    });
    syncSkills(path.join(dir, 'app'));
    assert.ok(!fs.existsSync(path.join(dir, 'app/.claude')), pattern);
  }
});

test('symlinked workspace paths are not followed', () => {
  const dir = project({
    'app/package.json': { workspaces: ['outside/**'] },
    ...pkg(
      'sibling/web/node_modules/@data-client/react',
      '@data-client/react',
      '0.19.0',
      ['data-client-react'],
    ),
    'sibling/web/package.json': { dependencies: { '@data-client/react': '*' } },
  });
  fs.symlinkSync(
    path.join(dir, 'sibling'),
    path.join(dir, 'app/outside'),
    'junction',
  );
  syncSkills(path.join(dir, 'app'));
  assert.ok(!fs.existsSync(path.join(dir, 'app/.claude')));
});

for (const method of [0, 8]) {
  test(`Yarn PnP copies zipped skills without running .pnp.cjs (method ${method})`, () => {
    const { dir, ran } = zippedReact(
      '0.19.0',
      {
        'skills/data-client-react/SKILL.md': 'React skill.',
        'skills/data-client-react/references/a.md': 'ref',
        'skills/../../../../escaped': 'no',
        // a separator only on Windows, where path.join would climb out
        'skills/..\\..\\..\\..\\escaped': 'no',
        'index.js': 'not copied',
      },
      method,
    );
    assert.deepEqual(syncSkills(dir).added, ['data-client-react']);
    assert.deepEqual(listing(skillsDir(dir)), [
      'data-client-react',
      path.join('data-client-react', '.data-client'),
      path.join('data-client-react', 'SKILL.md'),
      path.join('data-client-react', 'references'),
      path.join('data-client-react', 'references', 'a.md'),
    ]);
    assert.ok(!ran(), '.pnp.cjs ran');
  });
}

test('Yarn PnP copies are replaced on upgrade and removed with the package', () => {
  const { dir } = zippedReact('0.19.0', {
    'skills/data-client-react/SKILL.md': 'old',
  });
  syncSkills(dir);
  const upgraded = zippedReact('0.19.1', {
    'skills/data-client-react/SKILL.md': 'new',
  });
  fs.copyFileSync(
    path.join(upgraded.dir, '.yarn/cache/react.zip'),
    path.join(dir, '.yarn/cache/react.zip'),
  );
  assert.deepEqual(syncSkills(dir), {
    added: ['data-client-react'],
    removed: [],
    outdated: [],
    kept: [],
    junctions: false,
    dir: '.agents/skills',
  });
  assert.equal(skillText(dir, 'data-client-react'), 'new');
  fs.rmSync(path.join(dir, '.pnp.cjs'));
  assert.deepEqual(syncSkills(dir).removed, ['data-client-react']);
});

test('Yarn PnP copies unplugged packages too', () => {
  const unplugged = '.yarn/unplugged/react/node_modules/@data-client/react';
  const { dir } = pnpProject([['@data-client/react', `./${unplugged}/`]], {
    ...pkg(unplugged, '@data-client/react', '0.19.0', ['data-client-react']),
  });
  syncSkills(dir);
  assert.match(skillText(dir, 'data-client-react'), /data-client-react skill/);
});

test('node_modules wins over a PnP map left beside it', () => {
  for (const pnp of [
    // no RAW_RUNTIME_STATE literal, as a Yarn 2 map or a leftover could be
    'const map = ["@data-client/react", "npm:0.18.0"];\n',
    undefined,
  ]) {
    const unplugged = '.yarn/unplugged/react/node_modules/@data-client/react';
    const { dir } = pnpProject([['@data-client/react', `./${unplugged}/`]], {
      ...pkg(unplugged, '@data-client/react', '0.18.0', ['data-client-old']),
      'package.json': { dependencies: { '@data-client/react': '*' } },
      ...pkg(
        'node_modules/@data-client/react',
        '@data-client/react',
        '0.19.0',
        ['data-client-react'],
      ),
      ...(pnp ? { '.pnp.cjs': pnp } : {}),
    });
    assert.deepEqual(syncSkills(dir).added, ['data-client-react']);
  }
});
