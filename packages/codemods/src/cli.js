#!/usr/bin/env node
'use strict';

// npx @data-client/codemods <codemod> <path...> [jscodeshift options]
// Runs one of ./transforms with jscodeshift, skipping node_modules. Other
// jscodeshift options (--dry, --print, --extensions) pass through.
const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, 'transforms');
const codemods = fs
  .readdirSync(dir)
  .filter(file => file.endsWith('.js'))
  .map(file => file.slice(0, -'.js'.length));

const [codemod, ...args] = process.argv.slice(2);
if (!codemods.includes(codemod)) {
  process.stderr.write(
    (codemod ? `Unknown codemod "${codemod}".\n\n` : '') +
      'Usage: npx @data-client/codemods <codemod> <path...> [jscodeshift options]\n\n' +
      `Codemods: ${codemods.join(', ')}\n` +
      'Example: npx @data-client/codemods v0.18 src/\n',
  );
  process.exit(1);
}

process.argv = [
  process.argv[0],
  'jscodeshift',
  `--transform=${path.join(dir, `${codemod}.js`)}`,
  '--ignore-pattern=node_modules',
  ...args,
];
require('jscodeshift/bin/jscodeshift.js');
