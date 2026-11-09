// Runs the skill sync against scratch projects, one per install layout:
// node --test 'packages/core/agents/*.test.mjs'
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import zlib from 'node:zlib';

import { workspaceRoot } from './node-modules.mjs';
import { main, PACKAGES, syncSkills } from './skills.mjs';

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

/** `real` reached through a linked folder, as junctions see it on Windows */
function aliased(real) {
  const dir = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'dc-alias-')),
    'app',
  );
  fs.symlinkSync(real, dir, 'dir');
  return dir;
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
    skippedUpgrades: [],
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
    skippedUpgrades: [],
    junctions: false,
    dir: '.agents/skills',
  });
});

test('links upgrade skills only with upgrade, and removes them after', () => {
  const dir = hoisted();
  write(
    dir,
    pkg('node_modules/@data-client/rest', '@data-client/rest', '0.19.0', [
      'data-client-rest',
      'path-to-regexp-v8-migration',
    ]),
  );
  const fresh = syncSkills(dir);
  assert.ok(!fresh.added.includes('path-to-regexp-v8-migration'));
  assert.deepEqual(fresh.skippedUpgrades, ['path-to-regexp-v8-migration']);
  assert.deepEqual(syncSkills(dir, { upgrade: true }), {
    added: ['path-to-regexp-v8-migration'],
    removed: [],
    outdated: [],
    kept: [],
    skippedUpgrades: [],
    junctions: false,
    dir: '.agents/skills',
  });
  assert.match(
    skillText(dir, 'path-to-regexp-v8-migration'),
    /path-to-regexp-v8-migration skill/,
  );
  assert.deepEqual(syncSkills(dir).removed, ['path-to-regexp-v8-migration']);
});

test('main names the upgrade skills it leaves out, except ones it just removed', t => {
  const dir = hoisted();
  write(
    dir,
    pkg('node_modules/@data-client/rest', '@data-client/rest', '0.19.0', [
      'data-client-rest',
      'path-to-regexp-v8-migration',
    ]),
  );
  const log = t.mock.method(console, 'log', () => {});
  const output = args => {
    log.mock.resetCalls();
    main(dir, args);
    return log.mock.calls.map(call => call.arguments[0]);
  };
  assert.match(
    output([]).at(-1),
    /Add --upgrade to also link path-to-regexp-v8-migration/,
  );
  assert.deepEqual(output(['--upgrade']), [
    'Added path-to-regexp-v8-migration',
  ]);
  assert.deepEqual(output([]), ['Removed path-to-regexp-v8-migration']);
});

test('main rejects unknown options without syncing', t => {
  const dir = hoisted();
  const error = t.mock.method(console, 'error', () => {});
  main(dir, ['--upgrad']);
  assert.equal(process.exitCode, 1);
  process.exitCode = undefined;
  assert.match(error.mock.calls[0].arguments[0], /Unknown option --upgrad/);
  assert.ok(!fs.existsSync(path.join(dir, '.agents')));
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
  // a project that keeps skills in a real .claude/skills keeps them there,
  // and Codex reads them through .agents/skills
  assert.ok(links(dir)['data-client-rest']);
  assert.equal(
    fs.readlinkSync(path.join(dir, '.agents/skills')),
    '../.claude/skills',
  );
  fs.rmSync(path.join(dir, 'node_modules'), { recursive: true });
  syncSkills(dir);
  assert.equal(skillText(dir, 'data-client-react'), 'mine');
  assert.deepEqual(Object.keys(links(dir)), ['other']);
});

test('the skills CLI layout: .agents/skills with a link to each skill in .claude/skills', () => {
  const dir = hoisted();
  // what `npx skills add` leaves
  write(dir, { '.agents/skills/data-client-setup/SKILL.md': 'from the CLI' });
  fs.mkdirSync(skillsDir(dir), { recursive: true });
  fs.symlinkSync(
    '../../.agents/skills/data-client-setup',
    path.join(skillsDir(dir), 'data-client-setup'),
  );
  assert.equal(syncSkills(dir).dir, '.agents/skills');
  assert.ok(
    fs
      .lstatSync(path.join(dir, '.agents/skills/data-client-react'))
      .isSymbolicLink(),
  );
  assert.deepEqual(links(dir), {
    'data-client-manager': '../../.agents/skills/data-client-manager',
    'data-client-react': '../../.agents/skills/data-client-react',
    'data-client-rest': '../../.agents/skills/data-client-rest',
    'data-client-setup': '../../.agents/skills/data-client-setup',
  });
  assert.match(skillText(dir, 'data-client-react'), /data-client-react skill/);
  fs.rmSync(path.join(dir, 'node_modules/@data-client/rest'), {
    recursive: true,
  });
  assert.deepEqual(syncSkills(dir).removed, ['data-client-rest']);
  assert.ok(!('data-client-rest' in links(dir)));
  assert.equal(skillText(dir, 'data-client-setup'), 'from the CLI');
});

test('the skills CLI layout recreates .agents/skills after it was deleted', () => {
  const dir = hoisted();
  fs.mkdirSync(path.join(dir, '.agents/skills'), { recursive: true });
  fs.mkdirSync(skillsDir(dir), { recursive: true });
  syncSkills(dir);
  fs.rmSync(path.join(dir, '.agents/skills'), { recursive: true });
  const { dir: synced, kept } = syncSkills(dir);
  assert.equal(synced, '.agents/skills');
  assert.deepEqual(kept, []);
  assert.ok(!fs.lstatSync(path.join(dir, '.agents/skills')).isSymbolicLink());
  assert.match(skillText(dir, 'data-client-react'), /data-client-react skill/);
});

test('recreates .agents/skills when junctions in .claude/skills lead through a linked parent', () => {
  const real = hoisted();
  // the project as reached through a linked folder; junctions hold real paths
  const dir = aliased(real);
  fs.mkdirSync(skillsDir(dir), { recursive: true });
  fs.mkdirSync(path.join(dir, '.agents'));
  fs.symlinkSync(
    path.join(real, '.agents/skills/data-client-react'),
    path.join(skillsDir(dir), 'data-client-react'),
  );
  assert.equal(syncSkills(dir).dir, '.agents/skills');
  assert.ok(!fs.lstatSync(path.join(dir, '.agents/skills')).isSymbolicLink());
  assert.match(skillText(dir, 'data-client-react'), /data-client-react skill/);
});

test('the skills CLI layout falls back to junctions that follow the .agents/skills entry', () => {
  const dir = hoisted();
  fs.mkdirSync(path.join(dir, '.agents/skills'), { recursive: true });
  fs.mkdirSync(skillsDir(dir), { recursive: true });
  // Windows without symlink rights: only junctions, with absolute targets
  const symlink = fs.symlinkSync;
  fs.symlinkSync = (target, file, type) => {
    if (type !== 'junction')
      throw Object.assign(new Error('denied'), { code: 'EPERM' });
    symlink(target, file);
  };
  try {
    assert.equal(syncSkills(dir).junctions, true);
    const agents = fs.realpathSync(path.join(dir, '.agents/skills'));
    // every skill, not just the first: a junction doesn't stop the rest
    assert.deepEqual(Object.keys(links(dir)).sort(), [
      'data-client-manager',
      'data-client-react',
      'data-client-rest',
    ]);
    assert.equal(
      links(dir)['data-client-rest'],
      path.join(agents, 'data-client-rest'),
    );
    fs.rmSync(path.join(dir, 'node_modules/@data-client/rest'), {
      recursive: true,
    });
    assert.deepEqual(syncSkills(dir).removed, ['data-client-rest']);
    assert.ok(!('data-client-rest' in links(dir)));
    assert.deepEqual(syncSkills(dir).added, []);
  } finally {
    fs.symlinkSync = symlink;
  }
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
  const dir = aliased(real);
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
      skippedUpgrades: [],
      junctions: false,
      dir: '.agents/skills',
    });
  });
}

test('pnpm links transitive packages through a direct one, so upgrades follow', () => {
  // as pnpm lays it out: each package in its own store folder, with its
  // dependencies linked next to it
  const folder = (name, version) =>
    `node_modules/.pnpm/@data-client+${name}@${version}/node_modules/@data-client`;
  const store = version => folder('react', version);
  const install = version => ({
    ...pkg(`${store(version)}/react`, '@data-client/react', version, [
      'data-client-react',
    ]),
    ...pkg(`${folder('core', version)}/core`, '@data-client/core', version, [
      'data-client-manager',
    ]),
  });
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...install('0.19.0'),
    ...install('0.19.1'),
  });
  for (const version of ['0.19.0', '0.19.1'])
    fs.symlinkSync(
      path.join(dir, folder('core', version), 'core'),
      path.join(dir, store(version), 'core'),
      'junction',
    );
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
  // without a link beside react, only the store path reaches core
  fs.rmSync(path.join(dir, store('0.19.1'), 'core'));
  syncSkills(dir);
  assert.match(
    links(dir)['data-client-manager'],
    /\.pnpm\/@data-client\+core@/,
  );
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
const app = (name, version, base = 'apps') => ({
  [`${base}/${name}/package.json`]: {
    dependencies: { '@data-client/react': version },
  },
  ...pkg(
    `${base}/${name}/node_modules/@data-client/react`,
    '@data-client/react',
    version,
    ['data-client-react'],
  ),
});

test('workspaceRoot finds the root whose workspaces include a package', () => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    'tools/package.json': { name: 'tools' },
  });
  assert.equal(workspaceRoot(path.join(dir, 'apps/web')), dir);
  assert.equal(workspaceRoot(path.join(dir, 'tools')), undefined);
  assert.equal(workspaceRoot(dir), undefined);
});

test('workspaceRoot stops at the repository root', () => {
  const dir = project({
    'package.json': { workspaces: ['repo/apps/*'] },
    'repo/.git': 'gitdir: elsewhere',
    ...app('web', '0.19.0', 'repo/apps'),
  });
  assert.equal(workspaceRoot(path.join(dir, 'repo/apps/web')), undefined);
});

test('workspaceRoot works before git init, and skips manifests it cannot parse', () => {
  const dir = project({
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
  });
  assert.equal(workspaceRoot(path.join(dir, 'apps/web')), dir);
  write(dir, { '.git/HEAD': 'ref', 'apps/package.json': '// JSONC' });
  assert.equal(workspaceRoot(path.join(dir, 'apps/web')), dir);
});

test("run at a nested workspace root, it links its packages' skills at the outer root", t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['packages/*'] },
    'packages/suite/package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0', 'packages/suite/apps'),
  });
  run(t, path.join(dir, 'packages/suite'));
  assert.ok(links(dir)['data-client-react']);
});

test('run in a workspace package, it removes package links whose package is gone', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
  });
  const web = path.join(dir, 'apps/web');
  fs.mkdirSync(path.join(web, '.agents/skills'), { recursive: true });
  fs.symlinkSync(
    '../../node_modules/@data-client/rest/skills/data-client-rest',
    path.join(web, '.agents/skills/data-client-rest'),
  );
  assert.ok(run(t, web).includes('Removed data-client-rest from this package'));
  assert.ok(!fs.readdirSync(path.join(web, '.agents/skills')).length);
});

test('workspaceRoot climbs to the outermost of nested workspace roots', () => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['packages/*'] },
    'packages/suite/package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0', 'packages/suite/apps'),
  });
  assert.equal(workspaceRoot(path.join(dir, 'packages/suite/apps/web')), dir);
});

test('run in a workspace package without --upgrade, it removes the upgrade skills an earlier run linked there', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    ...pkg(
      'apps/web/node_modules/@data-client/rest',
      '@data-client/rest',
      '0.19.0',
      ['data-client-rest', 'path-to-regexp-v8-migration'],
    ),
  });
  const web = path.join(dir, 'apps/web');
  syncSkills(web, { upgrade: true });
  const output = run(t, web);
  assert.deepEqual(fs.readdirSync(path.join(web, '.agents/skills')), []);
  assert.ok(
    output.includes(
      'Removed data-client-react, data-client-rest from this package; the workspace root has them',
    ),
  );
  assert.ok(
    output.includes('Removed path-to-regexp-v8-migration from this package'),
  );
});

test('run in workspace packages installing different versions, each loads its own', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('alpha', '0.19.0'),
    ...app('beta', '0.19.1'),
  });
  // the package's own link, or else the root's
  const loaded = app => {
    const own = path.join(app, '.agents/skills/data-client-react');
    return fs.realpathSync(
      fs.existsSync(own) ? own : (
        path.join(dir, '.agents/skills/data-client-react')
      ),
    );
  };
  for (const name of ['beta', 'alpha', 'beta']) {
    const app = path.join(dir, 'apps', name);
    run(t, app);
    assert.equal(
      loaded(app),
      fs.realpathSync(
        path.join(
          app,
          'node_modules/@data-client/react/skills/data-client-react',
        ),
      ),
    );
  }
});

test('run in a workspace package installing another version than the root, it links that one there', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': {
      workspaces: ['apps/*'],
      dependencies: { '@data-client/react': '0.19.0' },
    },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
    ...app('beta', '0.19.1'),
  });
  const beta = path.join(dir, 'apps/beta');
  run(t, beta);
  assert.equal(
    links(dir)['data-client-react'],
    '../../node_modules/@data-client/react/skills/data-client-react',
  );
  assert.equal(
    links(beta)['data-client-react'],
    '../../node_modules/@data-client/react/skills/data-client-react',
  );
});

test('run in a workspace package, it removes a copy an earlier run left at another version', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.1'),
    'apps/web/.agents/skills/data-client-react/SKILL.md': 'old skill',
    'apps/web/.agents/skills/data-client-react/.data-client':
      '@data-client/react@0.19.0',
  });
  const web = path.join(dir, 'apps/web');
  assert.ok(
    run(t, web).includes(
      'Removed data-client-react from this package; the workspace root has them',
    ),
  );
  assert.deepEqual(fs.readdirSync(path.join(web, '.agents/skills')), []);
  assert.ok(links(dir)['data-client-react']);
});

test("run in a workspace package that doesn't install a skill, it reports its own copy shadowing the root's", t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    'apps/docs/package.json': { name: 'docs' },
    'apps/docs/.agents/skills/data-client-react/SKILL.md': 'skills CLI copy',
  });
  assert.ok(
    run(t, path.join(dir, 'apps/docs')).includes(
      'Kept .agents/skills/data-client-react (not a link data-client-skills made); delete it to get the installed version',
    ),
  );
});

test("run in a workspace package, it keeps its links when an entry of the user's blocks the root's", t => {
  for (const [rootFiles, folder] of [
    [
      { '.agents/skills/data-client-react': 'link checked out as a file' },
      '.agents',
    ],
    [
      {
        '.agents/skills/mine/SKILL.md': 'my own skill',
        '.claude/skills/data-client-react': 'link checked out as a file',
      },
      '.claude',
    ],
    [{ '.claude/skills': '../.agents/skills' }, '.claude'],
  ]) {
    const dir = project({
      '.git/HEAD': 'ref',
      'package.json': { workspaces: ['apps/*'] },
      ...app('web', '0.19.0'),
      ...rootFiles,
    });
    const web = path.join(dir, 'apps/web');
    syncSkills(web);
    run(t, web);
    assert.ok(
      fs.existsSync(
        path.join(web, folder, 'skills/data-client-react/SKILL.md'),
      ),
      JSON.stringify(rootFiles),
    );
  }
});

test("links skills in the package when the workspace root's .agents/skills link checked out as a file", t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    '.agents/skills': '../custom',
  });
  const web = path.join(dir, 'apps/web');
  run(t, web);
  assert.ok(links(web)['data-client-react']);
});

/** Runs main() from `cwd`, returning what it logged */
function run(t, cwd) {
  const log = t.mock.method(console, 'log', () => {});
  main(cwd, []);
  return log.mock.calls.map(call => call.arguments[0]);
}

test('run in a workspace package, it links at the workspace root', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
  });
  const output = run(t, path.join(dir, 'apps/web'));
  assert.equal(
    links(dir)['data-client-react'],
    '../../apps/web/node_modules/@data-client/react/skills/data-client-react',
  );
  assert.ok(!fs.existsSync(path.join(dir, 'apps/web/.agents')));
  assert.deepEqual(output, [
    'Added data-client-react',
    'Synced ../../.agents/skills at the workspace root, which covers every workspace package',
  ]);
});

test('run in a workspace package, it removes the skills an earlier run linked there', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    'apps/web/.agents/skills/mine/SKILL.md': 'my own skill',
  });
  const web = path.join(dir, 'apps/web');
  syncSkills(web);
  const output = run(t, web);
  assert.ok(
    output.includes(
      'Removed data-client-react from this package; the workspace root has them',
    ),
  );
  assert.deepEqual(fs.readdirSync(path.join(web, '.agents/skills')), ['mine']);
  assert.ok(links(dir)['data-client-react']);
});

test("run in a workspace package, it reports the package's own copy of a skill the root links", t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    'apps/web/.agents/skills/data-client-react/SKILL.md': 'skills CLI copy',
    'apps/web/.agents/skills/mine/SKILL.md': 'my own skill',
    '.agents/skills/mine/SKILL.md': 'my own skill at the root',
  });
  const web = path.join(dir, 'apps/web');
  assert.deepEqual(run(t, web), [
    'Added data-client-react',
    'Kept .agents/skills/data-client-react (not a link data-client-skills made); delete it to get the installed version',
    'Synced ../../.agents/skills at the workspace root, which covers every workspace package',
  ]);
  assert.ok(
    fs.existsSync(path.join(web, '.agents/skills/data-client-react/SKILL.md')),
  );
});

test("links skills in the package when the workspace root can't take them", t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'package.json': { workspaces: ['apps/*'] },
    ...app('web', '0.19.0'),
    'custom/mine/SKILL.md': 'my own skill',
  });
  fs.mkdirSync(path.join(dir, '.agents'));
  fs.symlinkSync(
    path.join(dir, 'custom'),
    path.join(dir, '.agents/skills'),
    'junction',
  );
  const web = path.join(dir, 'apps/web');
  const output = run(t, web);
  assert.ok(links(web)['data-client-react']);
  assert.deepEqual(output, [
    'Added data-client-react',
    "The workspace root's skill folders are links data-client-skills doesn't manage, so this package holds the skills; remove those links to have them at the root",
    'Claude Code and Cursor started at the repository root load apps/web/.agents/skills only once they work on files in apps/web; start your agent in apps/web to have them from the start.',
  ]);
});

test('run in a workspace below the repository root, it says to start the agent there', t => {
  const dir = project({
    '.git/HEAD': 'ref',
    'web/package.json': { workspaces: ['apps/*'] },
    ...app('site', '0.19.0', 'web/apps'),
  });
  const output = run(t, path.join(dir, 'web/apps/site'));
  assert.ok(links(path.join(dir, 'web'))['data-client-react']);
  assert.deepEqual(output.slice(-2), [
    'Synced ../../.agents/skills at the workspace root, which covers every workspace package',
    'Claude Code and Cursor started at the repository root load web/.agents/skills only once they work on files in web; start your agent in web to have them from the start.',
  ]);
});

test('run in an app below the repository root, it says where agents load the skills', t => {
  const dir = project({ '.git/HEAD': 'ref', ...app('web', '0.19.0') });
  const output = run(t, path.join(dir, 'apps/web'));
  assert.ok(links(path.join(dir, 'apps/web'))['data-client-react']);
  assert.match(
    output.at(-1),
    /load apps\/web\/\.agents\/skills only once they work on files in apps\/web; start your agent in apps\/web/,
  );
  assert.equal(run(t, dir).length, 1);
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

/**
 * What `yarn data-client-skills` runs under, for test `t`: Yarn's patched fs
 * reports paths inside zips as existing, and Node's own fs.cpSync can't read them
 */
function yarnRuntime(t) {
  const { existsSync } = fs;
  t.mock.method(
    fs,
    'existsSync',
    file => /\.zip[\\/]/.test(String(file)) || existsSync(file),
  );
  // put back whatever was there, in case the suite itself runs under Yarn
  const versions = Object.getOwnPropertyDescriptor(process.versions, 'pnp');
  Object.defineProperty(process.versions, 'pnp', {
    value: '3',
    configurable: true,
  });
  t.after(() => {
    if (versions) Object.defineProperty(process.versions, 'pnp', versions);
    else delete process.versions.pnp;
  });
}

test("Yarn PnP copies under Yarn's own runtime, which shows zips as folders", t => {
  const { dir } = zippedReact('0.19.0', {
    'skills/data-client-react/SKILL.md': 'React skill.',
  });
  yarnRuntime(t);
  assert.deepEqual(syncSkills(dir).added, ['data-client-react']);
  const skill = path.join(skillsDir(dir), 'data-client-react');
  assert.ok(!fs.lstatSync(skill).isSymbolicLink());
  assert.equal(
    fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8'),
    'React skill.',
  );
});

test("Yarn PnP skips a zip without the package, under Yarn's runtime too", t => {
  const inZip = 'node_modules/@data-client/react/';
  const { dir } = pnpProject(
    [['@data-client/react', `./.yarn/cache/react.zip/${inZip}`]],
    { '.yarn/cache/react.zip': zip({ [`${inZip}other.txt`]: '' }, 0) },
  );
  yarnRuntime(t);
  assert.deepEqual(syncSkills(dir).added, []);
});

test('Yarn PnP reads unzipped packages in a folder named like a zip', () => {
  for (const location of ['apps.zip/react', 'apps.zip/node_modules/react']) {
    const { dir } = pnpProject(
      [['@data-client/react', `./${location}/`]],
      pkg(location, '@data-client/react', '0.19.0', ['data-client-react']),
    );
    assert.deepEqual(syncSkills(dir).added, ['data-client-react']);
  }
});

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
    skippedUpgrades: [],
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

test('Yarn PnP reads large install maps', () => {
  const unplugged = '.yarn/unplugged/react/node_modules/@data-client/react';
  // a big monorepo's map, past where a per-character regex overflows
  const others = Array.from({ length: 80000 }, (_, i) => [
    `other-package-${i}`,
    `./.yarn/cache/other-package-${i}.zip/node_modules/other-package-${i}/`,
  ]);
  const { dir } = pnpProject(
    [['@data-client/react', `./${unplugged}/`], ...others],
    pkg(unplugged, '@data-client/react', '0.19.0', ['data-client-react']),
  );
  assert.ok(fs.statSync(path.join(dir, '.pnp.cjs')).size > 9e6);
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
