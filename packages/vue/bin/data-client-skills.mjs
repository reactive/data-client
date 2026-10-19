#!/usr/bin/env node
// react, vue, rest, graphql and endpoint each have this command: pnpm only
// links bins of direct dependencies, and no one of them is in every repo.
// agents/ is copied from packages/core/agents at pack time.
// Plain syntax so older Node reaches the version check
var major = +process.versions.node.split('.')[0];
if (major < 16) {
  console.error('data-client-skills needs Node 16 or later');
  process.exit(1);
}
import('../agents/skills.mjs').then(function (skills) {
  skills.main();
});
