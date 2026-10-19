#!/usr/bin/env node
// Every package that ships skills, and graphql, has this command: pnpm only
// links bins of direct dependencies, and no one package is in every repo.
// agents/ is copied from packages/core/agents at pack time.
import { main } from '../agents/skills.mjs';

main();
