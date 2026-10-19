#!/usr/bin/env node
// react, vue, rest, graphql and endpoint each have this command: pnpm only
// links bins of direct dependencies, and no one of them is in every repo.
// agents/ is copied from packages/core/agents at pack time.
// Plain syntax so older Node reaches the version check
var version = process.versions.node.split('.').map(Number);
if (version[0] < 16 || (version[0] === 16 && version[1] < 7)) {
  console.error('data-client-skills needs Node 16.7 or later');
  process.exit(1);
}
import('../agents/skills.mjs').then(function (skills) {
  skills.main();
});
