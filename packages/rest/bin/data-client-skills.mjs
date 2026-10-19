#!/usr/bin/env node
// Every package that ships skills, and graphql, has this command: pnpm only
// links bins of direct dependencies, and no one package is in every repo.
// core keeps agents/ in source; the others get a copy at pack time.
// Plain syntax so older Node reaches the version check
var major = +process.versions.node.split('.')[0];
if (major < 16) {
  console.error('data-client-skills needs Node 16 or later');
  process.exit(1);
}
import('../agents/skills.mjs').then(function (skills) {
  skills.main();
});
