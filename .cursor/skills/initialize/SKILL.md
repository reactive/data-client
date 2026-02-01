---
name: initialize
description: Setup, install, and onboard new developers to Reactive Data Client monorepo - nvm, yarn, build, test, getting started guide
disable-model-invocation: true
---

# Initialize Development Environment

## Overview
Get a new developer up and running with the Reactive Data Client monorepo.

## Steps
1. **Install prerequisites**
   - Install Node.js >= 14 via [nvm](https://github.com/nvm-sh/nvm): `nvm install`
   - Enable Corepack for Yarn 4: `corepack enable`
   - Verify Yarn: `yarn --version` (should be 4.x)

2. **Install dependencies**
   - Run `yarn install` from repo root
   - This installs all workspace dependencies

3. **Build the project**
   - Run `yarn build` to build all packages
   - This runs TypeScript compilation and Babel transforms

4. **Run tests**
   - Run `yarn test` to verify everything works
   - Tests use Jest with projects: ReactDOM, Node, ReactNative

5. **Project familiarization**
   - Review monorepo structure:
     - `packages/endpoint` – Base endpoints and declarative schemas
     - `packages/rest` – REST modeling (`resource()`, `RestEndpoint`)
     - `packages/core` – Framework-agnostic normalized store
     - `packages/react` – React hooks (`useSuspense`, `useLive`, `useQuery`)
     - `packages/vue` – Vue 3 composables
     - `packages/normalizr` – Schema/Entity/normalization
   - Read [official docs](https://dataclient.io/docs)
   - Explore example apps in `examples/`

6. **Optional: Start website locally**
   - Use workspace task "website: start" or `cd website && yarn start`
   - Documentation site runs on localhost

## Onboarding Checklist
- [ ] Node.js >= 14 and Yarn 4 ready
- [ ] `yarn install` completed without errors
- [ ] `yarn build` succeeds
- [ ] `yarn test` passes
- [ ] Reviewed `packages/` structure
- [ ] Read `CONTRIBUTING.md`
- [ ] Explored an example app (`examples/todo-app` or `examples/github-app`)

## Helpful Commands
| Command | Description |
|---------|-------------|
| `yarn build` | Build all packages |
| `yarn test` | Run all tests |
| `yarn lint` | Run ESLint |
| `yarn format` | Auto-fix lint issues |
| `yarn changeset` | Create a changeset for your PR |

## Resources
- [Documentation](https://dataclient.io/docs)
- [Discord](https://discord.gg/35nb8Mz)
- [Contributing Guide](./CONTRIBUTING.md)
