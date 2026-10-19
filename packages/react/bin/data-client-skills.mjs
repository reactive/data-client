#!/usr/bin/env node
// On react and vue rather than core: pnpm only links bins of direct
// dependencies, and core is usually transitive
import { main } from '@data-client/core/agents/skills';

main();
