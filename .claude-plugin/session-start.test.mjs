// Runs the SessionStart hook against scratch projects, one per install layout:
// node --test '.claude-plugin/*.test.mjs'
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import zlib from 'node:zlib';

const hook = fileURLToPath(new URL('session-start.mjs', import.meta.url));

/** Writes `files` (path -> JSON object or text) under a new project dir */
function project(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-hook-'));
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

/** The plugin data directory `run` gives the hook for `dir` */
const pluginData = dir => `${dir}-data`;

function run(dir, input = '', data = pluginData(dir)) {
  return execFileSync('node', [hook], {
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir, CLAUDE_PLUGIN_DATA: data },
    encoding: 'utf8',
    input,
  });
}

test('prints nothing without Data Client', () => {
  assert.equal(run(project({ 'package.json': { name: 'app' } })), '');
});

test('hoisted install lists shipped skills', () => {
  const out = run(
    project({
      'package.json': { dependencies: { '@data-client/react': '*' } },
      ...pkg(
        'node_modules/@data-client/react',
        '@data-client/react',
        '0.19.0',
        ['data-client-react'],
      ),
    }),
  );
  assert.match(out, /\(@data-client\/react@0\.19\.0\)/);
  assert.match(
    out,
    /- data-client-react: data-client-react skill\. \(node_modules\/@data-client\/react\/skills\/data-client-react\/SKILL\.md\)/,
  );
  assert.doesNotMatch(out, /predate/);
});

for (const field of [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
]) {
  test(`strict layout finds endpoint through graphql in ${field}`, () => {
    const out = run(
      project({
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
      }),
    );
    assert.match(out, /@data-client\/endpoint@0\.19\.0/);
    assert.match(out, /- data-client-schema:/);
  });
}

test('packages without skills fall back to the plugin copy', () => {
  const out = run(
    project({
      'package.json': { dependencies: { '@data-client/react': '*' } },
      ...pkg('node_modules/@data-client/react', '@data-client/react', '0.14.0'),
    }),
  );
  assert.match(out, /- data-client-react: /);
  assert.match(out, /predate shipped skills/);
});

test('pnpm workspaces, with comments, flow lists and CRLF', () => {
  for (const yaml of [
    'packages:\n  - apps/* # apps\n',
    "packages: ['apps/*']\n",
    'name: x\npackages:\n\n- "apps/*"\n',
    'packages:\r\n  - apps/*\r\n',
  ]) {
    const out = run(
      project({
        'package.json': { name: 'root' },
        'pnpm-workspace.yaml': yaml,
        'apps/web/package.json': {
          dependencies: { '@data-client/react': '*' },
        },
        ...pkg(
          'apps/web/node_modules/@data-client/react',
          '@data-client/react',
          '0.19.0',
          ['data-client-react'],
        ),
      }),
    );
    assert.match(out, /apps\/web\/node_modules\/@data-client\/react/, yaml);
  }
});

test('each workspace version is listed', () => {
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
  const out = run(
    project({
      'package.json': { workspaces: { packages: ['apps/**'] } },
      ...app('admin', '0.18.0'),
      ...app('web', '0.19.0'),
    }),
  );
  assert.match(
    out,
    /@data-client\/react@0\.18\.0, @data-client\/react@0\.19\.0/,
  );
  assert.match(out, /apps\/admin\/node_modules/);
  assert.match(out, /apps\/web\/node_modules/);
});

test('pnpm store links find transitive packages', () => {
  const store = 'node_modules/.pnpm/@data-client+react@0.19.0/node_modules';
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...pkg(`${store}/@data-client/react`, '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
    ...pkg(`${store}/@data-client/core`, '@data-client/core', '0.19.0', [
      'data-client-manager',
    ]),
  });
  fs.mkdirSync(path.join(dir, 'node_modules/@data-client'));
  fs.symlinkSync(
    path.join(dir, store, '@data-client/react'),
    path.join(dir, 'node_modules/@data-client/react'),
    'junction',
  );
  const out = run(dir);
  assert.match(out, /@data-client\/core@0\.19\.0/);
  assert.match(out, /\(node_modules\/@data-client\/react\/skills\//);
});

test('only the first copy of the hook prints for a session start', () => {
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
  });
  const session_id = `test-${path.basename(dir)}`;
  const input = JSON.stringify({ session_id, source: 'startup' });
  assert.match(run(dir, input), /data-client-react/);
  assert.equal(run(dir, input), '');
  // a /clear right after startup is its own event
  assert.match(
    run(dir, JSON.stringify({ session_id, source: 'clear' })),
    /data-client-react/,
  );
  assert.match(run(dir, 'not json'), /data-client-react/);
});

test('copies racing on a resume print once', async () => {
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
  });
  const id = `test-${path.basename(dir)}`;
  const input = JSON.stringify({ session_id: id, source: 'resume' });
  run(dir, input);
  const old = new Date(Date.now() - 60_000);
  const marker = path.join(os.tmpdir(), `data-client-hook-${id}-resume`);
  fs.utimesSync(marker, old, old);
  const copies = Array.from({ length: 4 }, () =>
    promisify(execFile)('node', [hook], {
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    }),
  );
  // Claude Code can write stdin after the copies are already reading it
  await new Promise(resolve => setTimeout(resolve, 300));
  for (const copy of copies) copy.child.stdin.end(input);
  const printed = (await Promise.all(copies)).filter(({ stdout }) => stdout);
  assert.equal(printed.length, 1);
});

test('the session marker is never written through a planted symlink', () => {
  const dir = project({
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
  });
  const id = `test-${path.basename(dir)}`;
  const target = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'dc-victim-')),
    'keep',
  );
  fs.writeFileSync(target, 'keep');
  fs.symlinkSync(
    target,
    path.join(os.tmpdir(), `data-client-hook-${id}-startup`),
  );
  const input = JSON.stringify({ session_id: id, source: 'startup' });
  assert.match(run(dir, input), /data-client-react/);
  assert.equal(fs.readFileSync(target, 'utf8'), 'keep');
});

test('workspace exclusions skip their packages', () => {
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
  const out = run(
    project({
      'package.json': { name: 'root' },
      'pnpm-workspace.yaml':
        "packages:\n  - 'apps/**'\n  - '!**/fixtures/**'\n",
      ...app('web', '0.19.0'),
      ...app('web/fixtures/old', '0.18.0'),
    }),
  );
  assert.match(out, /apps\/web\/node_modules/);
  assert.doesNotMatch(out, /0\.18\.0|fixtures/);
});

test('workspaces outside the project are ignored', () => {
  for (const pattern of ['../**', '..\\**', 'packages\\..\\..\\**']) {
    const dir = project({
      'app/package.json': { workspaces: [pattern] },
      ...pkg(
        'sibling/node_modules/@data-client/react',
        '@data-client/react',
        '0.19.0',
      ),
      'sibling/package.json': { dependencies: { '@data-client/react': '*' } },
    });
    assert.equal(run(path.join(dir, 'app')), '', pattern);
  }
});

test('symlinked workspace paths are not followed', () => {
  const dir = project({
    'app/package.json': { workspaces: ['outside/**'] },
    ...pkg(
      'sibling/web/node_modules/@data-client/react',
      '@data-client/react',
      '0.19.0',
    ),
    'sibling/web/package.json': { dependencies: { '@data-client/react': '*' } },
  });
  fs.symlinkSync(
    path.join(dir, 'sibling'),
    path.join(dir, 'app/outside'),
    'junction',
  );
  assert.equal(run(path.join(dir, 'app')), '');
});

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

/** The one copy of `pkg` the hook made in `data`'s pnp-skills */
function copyOf(data, pkg = '@data-client/react') {
  const dir = path.join(data, 'pnp-skills', pkg);
  const [hash] = fs.readdirSync(dir);
  return path.join(dir, hash);
}

for (const method of [0, 8]) {
  test(`Yarn PnP reads zipped packages without running .pnp.cjs (method ${method})`, () => {
    const inZip = 'node_modules/@data-client/react/';
    const { dir, ran } = pnpProject(
      [['@data-client/react', `./.yarn/cache/react.zip/${inZip}`]],
      {
        '.yarn/cache/react.zip': zip(
          {
            [`${inZip}package.json`]: JSON.stringify({ version: '0.19.0' }),
            [`${inZip}skills/data-client-react/SKILL.md`]:
              '---\ndescription: React skill. More.\n---\n',
            [`${inZip}skills/../../../../escaped`]: 'no',
            // a separator only on Windows, where path.join would climb out
            [`${inZip}skills/..\\..\\..\\..\\escaped`]: 'no',
            [`${inZip}index.js`]: 'not copied',
          },
          method,
        ),
      },
    );
    const out = run(dir);
    const copied = copyOf(pluginData(dir));
    assert.match(out, /@data-client\/react@0\.19\.0/);
    assert.ok(
      out.includes(
        `(${path.join(copied, 'skills/data-client-react/SKILL.md')})`,
      ),
      out,
    );
    assert.deepEqual(listing(copied), [
      'package.json',
      'skills',
      path.join('skills', 'data-client-react'),
      path.join('skills', 'data-client-react', 'SKILL.md'),
    ]);
    assert.ok(!ran(), '.pnp.cjs ran');
  });
}

test('Yarn PnP reads unplugged packages', () => {
  const unplugged = '.yarn/unplugged/react/node_modules/@data-client/react';
  const { dir, ran } = pnpProject([['@data-client/react', `./${unplugged}/`]], {
    ...pkg(unplugged, '@data-client/react', '0.19.0', ['data-client-react']),
  });
  const out = run(dir);
  assert.ok(out.includes(`(${unplugged}/skills/data-client-react/SKILL.md)`));
  assert.ok(!ran(), '.pnp.cjs ran');
});

/** A Yarn PnP project whose zipped @data-client/react ships one skill */
function zippedReact(description = 'React skill.') {
  const inZip = 'node_modules/@data-client/react/';
  return pnpProject(
    [['@data-client/react', `./.yarn/cache/react.zip/${inZip}`]],
    {
      '.yarn/cache/react.zip': zip(
        {
          [`${inZip}package.json`]: JSON.stringify({ version: '0.19.0' }),
          [`${inZip}skills/data-client-react/SKILL.md`]: `---\ndescription: ${description} More.\n---\n`,
        },
        0,
      ),
    },
  );
}

const listing = dir => fs.readdirSync(dir, { recursive: true }).sort();

test('Yarn PnP writes nothing into the project', () => {
  const { dir } = zippedReact();
  const before = listing(dir);
  assert.match(run(dir), /data-client-react/);
  assert.deepEqual(listing(dir), before);
});

test("a zip one project commits can't replace another project's copy", () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-data-'));
  const genuine = zippedReact('Genuine.');
  // same cache path and version, different contents
  const forged = zippedReact('Forged.');
  assert.match(run(forged.dir, '', data), /Forged\./);
  assert.match(run(genuine.dir, '', data), /Genuine\./);
});

test('a stale .pnp.cjs beside node_modules is ignored', () => {
  const out = run(
    project({
      'package.json': { dependencies: { '@data-client/react': '*' } },
      ...pkg(
        'node_modules/@data-client/react',
        '@data-client/react',
        '0.19.0',
        ['data-client-react'],
      ),
      // no RAW_RUNTIME_STATE literal, as a Yarn 2 map or a leftover could be
      '.pnp.cjs': 'const map = ["@data-client/react", "npm:0.18.0"];\n',
    }),
  );
  assert.match(out, /\(@data-client\/react@0\.19\.0\)/);
  assert.doesNotMatch(out, /0\.18\.0/);
});

test('node_modules wins over a valid PnP map left beside it', () => {
  const unplugged = '.yarn/unplugged/react/node_modules/@data-client/react';
  const { dir } = pnpProject([['@data-client/react', `./${unplugged}/`]], {
    ...pkg(unplugged, '@data-client/react', '0.18.0', ['data-client-react']),
    'package.json': { dependencies: { '@data-client/react': '*' } },
    ...pkg('node_modules/@data-client/react', '@data-client/react', '0.19.0', [
      'data-client-react',
    ]),
  });
  const out = run(dir);
  assert.match(out, /\(@data-client\/react@0\.19\.0\)/);
  assert.doesNotMatch(out, /0\.18\.0/);
});
