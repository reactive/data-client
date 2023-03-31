# Change Log

## 7.3.1

### Patch Changes

- 9157e9eba8: Fix: SSR previously would never unsuspend cache provider
  (NetworkManager.allSettled() must return undefined if nothing in flight)
- Updated dependencies [9157e9eba8]
  - @rest-hooks/core@4.3.1

## 7.3.0

### Minor Changes

- 775352c9ab: useController().fetch resolves to denormalized form
- 775352c9ab: Add /next export for early adoption of breaking changes

### Patch Changes

- 54aad5e028: FIx ResultEntry with schema
- Updated dependencies [54aad5e028]
- Updated dependencies [775352c9ab]
- Updated dependencies [775352c9ab]
  - @rest-hooks/core@4.3.0

## 7.2.12

### Patch Changes

- dbc4d0b843: Polling intervals double check cancellation before dispatching fetch
- Updated dependencies [dbc4d0b843]
- Updated dependencies [dbc4d0b843]
  - @rest-hooks/core@4.2.11

## 7.2.11

### Patch Changes

- f927a15c14: Add ErrorTypes export
- Updated dependencies [f927a15c14]
  - @rest-hooks/core@4.2.10

## 7.2.10

### Patch Changes

- ebe0fcc15c: fix: PnP compatibility

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

### [7.2.9](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.8...@rest-hooks/react@7.2.9) (2023-03-21)

**Note:** Version bump only for package @rest-hooks/react

### [7.2.8](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.7...@rest-hooks/react@7.2.8) (2023-03-19)

### 🐛 Bug Fix

- Controller type generics refer to findable types ([449d326](https://github.com/data-client/rest-hooks/commit/449d326b0163cd3f915dedf7406c6a18857c1550))

### [7.2.7](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.6...@rest-hooks/react@7.2.7) (2023-03-15)

### 💅 Enhancement

- Mark useController() as 'use client' since it has context ([5f25fba](https://github.com/data-client/rest-hooks/commit/5f25fbadd4747cd47962b27ba1400acba4753310))

### 📦 Package

- Update babel packages ([#2487](https://github.com/data-client/rest-hooks/issues/2487)) ([3fc9efc](https://github.com/data-client/rest-hooks/commit/3fc9efc0bfc818ae7b4a1113cf6f7daa8bbcba8c))

### [7.2.6](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.5...@rest-hooks/react@7.2.6) (2023-03-12)

### 📝 Documentation

- Update links in readme ([1141c0b](https://github.com/data-client/rest-hooks/commit/1141c0b41c05250e5455457d00a2c54b631e4f91))

### [7.2.5](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.4...@rest-hooks/react@7.2.5) (2023-03-02)

### 🚀 Features

- Add mixin schema.Entity() ([#2449](https://github.com/data-client/rest-hooks/issues/2449)) ([6c5d5db](https://github.com/data-client/rest-hooks/commit/6c5d5db7f5856c21927e9fa389c09ead11e93ea0))

### 💅 Enhancement

- Allow 'false' as Endpoint.sideEffect ([#2452](https://github.com/data-client/rest-hooks/issues/2452)) ([69b6a04](https://github.com/data-client/rest-hooks/commit/69b6a049861eeefc608f5a5df86b9833021961df))

### 📦 Package

- Update babel packages ([#2457](https://github.com/data-client/rest-hooks/issues/2457)) ([45c4a0a](https://github.com/data-client/rest-hooks/commit/45c4a0ab4ebd6112db75e8c6f09e5ad1add74c8b))
- Update JS test packages ([#2456](https://github.com/data-client/rest-hooks/issues/2456)) ([6732e63](https://github.com/data-client/rest-hooks/commit/6732e63a10ab3cebe70f22e44429c5edae65186e))

### [7.2.4](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.3...@rest-hooks/react@7.2.4) (2023-02-21)

### 💅 Enhancement

- Use null-object over Object.hasOwn when possible ([#2441](https://github.com/data-client/rest-hooks/issues/2441)) ([28f3fe8](https://github.com/data-client/rest-hooks/commit/28f3fe8890da119c7fa6498d4617a66da74ed0b4))

### [7.2.3](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.2...@rest-hooks/react@7.2.3) (2023-02-14)

**Note:** Version bump only for package @rest-hooks/react

### [7.2.2](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.1...@rest-hooks/react@7.2.2) (2023-02-11)

**Note:** Version bump only for package @rest-hooks/react

### [7.2.1](https://github.com/data-client/rest-hooks/compare/@rest-hooks/react@7.2.0...@rest-hooks/react@7.2.1) (2023-01-30)

### 📝 Documentation

- Update github organization to data-client ([#2396](https://github.com/data-client/rest-hooks/issues/2396)) ([45faab1](https://github.com/data-client/rest-hooks/commit/45faab1962cad292d1f77a0a997e8c321a6917db))

## [7.2.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.7...@rest-hooks/react@7.2.0) (2023-01-29)

### 🚀 Features

- Add controller.invalidateAll() ([#2382](https://github.com/coinbase/rest-hooks/issues/2382)) ([d145057](https://github.com/coinbase/rest-hooks/commit/d145057bbafb4a2efee5a31fdf2e32f1b16971b6))
- Add Interceptors ([#2380](https://github.com/coinbase/rest-hooks/issues/2380)) ([53653ba](https://github.com/coinbase/rest-hooks/commit/53653ba9462510938f57cfe4ff907fda2efcc874))

### 💅 Enhancement

- Improve strictNullChecks: false compatibility ([#2386](https://github.com/coinbase/rest-hooks/issues/2386)) ([1cfb5a5](https://github.com/coinbase/rest-hooks/commit/1cfb5a53564719952ee30b1b3160cd32f6bd2603))

### 🐛 Bug Fix

- Conditional null args type handling ([#2386](https://github.com/coinbase/rest-hooks/issues/2386)) ([6d6e0f7](https://github.com/coinbase/rest-hooks/commit/6d6e0f74399452fcf3e78561a69edcb6e8e78a9d))

### [7.1.7](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.6...@rest-hooks/react@7.1.7) (2023-01-23)

### 🐛 Bug Fix

- Add back DenormalizeCacheContext for older versions of redux ([8e0acab](https://github.com/coinbase/rest-hooks/commit/8e0acabbd86ca8cd2cd45d07c8e815df8c7375d9))

### [7.1.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.5...@rest-hooks/react@7.1.6) (2023-01-23)

### 🚀 Features

- makeRenderRestHook(CacheProvider) and React 18 testing ([#2328](https://github.com/coinbase/rest-hooks/issues/2328)) ([0e9e51e](https://github.com/coinbase/rest-hooks/commit/0e9e51e3bce3c9c978888a734c43be8d1fe3ae55))

### 💅 Enhancement

- Stop uncaught promises ([aac6fe9](https://github.com/coinbase/rest-hooks/commit/aac6fe9523c5eeee0068a227bcf39798c80fc55f))

### 📦 Package

- Update linting packages ([#2376](https://github.com/coinbase/rest-hooks/issues/2376)) ([305debd](https://github.com/coinbase/rest-hooks/commit/305debd269216444519d80c351fd63805a974343))

### 📝 Documentation

- Add atomic mutations concept ([#2369](https://github.com/coinbase/rest-hooks/issues/2369)) ([a56380b](https://github.com/coinbase/rest-hooks/commit/a56380b8cb39348572b99013945fbb217566662c))
- Update resource def best practices for github example ([#2363](https://github.com/coinbase/rest-hooks/issues/2363)) ([3144584](https://github.com/coinbase/rest-hooks/commit/3144584bb773c7c44362f08adedd89107d3b2313))

### [7.1.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.4...@rest-hooks/react@7.1.5) (2023-01-14)

### 🐛 Bug Fix

- Compatibility with React 18 StrictMode ([e7174a3](https://github.com/coinbase/rest-hooks/commit/e7174a3c2aac3fd611d2e1305a4fe4927ef50e38))

### 📦 Package

- Update linting packages ([#2351](https://github.com/coinbase/rest-hooks/issues/2351)) ([d3498ea](https://github.com/coinbase/rest-hooks/commit/d3498ea396dfbfdc745ec6e68920a714d8870fe8))

### [7.1.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.3...@rest-hooks/react@7.1.4) (2023-01-12)

### 📦 Package

- Update babel packages ([#2348](https://github.com/coinbase/rest-hooks/issues/2348)) ([5d0a68e](https://github.com/coinbase/rest-hooks/commit/5d0a68ea00b021effeae185fcdea415cf50c0328))

### 📝 Documentation

- Add TypeScriptEditor to aid type demos ([#2355](https://github.com/coinbase/rest-hooks/issues/2355)) ([2fb44a9](https://github.com/coinbase/rest-hooks/commit/2fb44a971d80a3a170d37dbc7ecf459c7da39722))

### [7.1.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.2...@rest-hooks/react@7.1.3) (2022-12-23)

### 🚀 Features

- Add ctrl.setResponse, ctrl.setError ([#2331](https://github.com/coinbase/rest-hooks/issues/2331)) ([46e3b63](https://github.com/coinbase/rest-hooks/commit/46e3b630dc66af54979eafbfc3c49847a4553f3f))

### 📦 Package

- Update babel packages ([#2339](https://github.com/coinbase/rest-hooks/issues/2339)) ([2cc99b9](https://github.com/coinbase/rest-hooks/commit/2cc99b99aeece58b0e7674ca80d3372555612c63))

### 📝 Documentation

- Add 7, 7.1 blog; new intro ([#2326](https://github.com/coinbase/rest-hooks/issues/2326)) ([b76c134](https://github.com/coinbase/rest-hooks/commit/b76c134cd8d0675c0eef7413ba3fddb6262443cb))
- Updates to the docs ([#2335](https://github.com/coinbase/rest-hooks/issues/2335)) ([73c8d9f](https://github.com/coinbase/rest-hooks/commit/73c8d9f4b403412cd766955305461aa7d8ebb462))
- Yet another docs change pr ([#2338](https://github.com/coinbase/rest-hooks/issues/2338)) ([52c2f83](https://github.com/coinbase/rest-hooks/commit/52c2f83d20106f8557ef8538a348c4bbac77dd53))

### [7.1.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.1...@rest-hooks/react@7.1.2) (2022-12-06)

### 💅 Enhancement

- Reduce bundlesize via custom Object.hasOwn polyfill ([#2322](https://github.com/coinbase/rest-hooks/issues/2322)) ([1f8009d](https://github.com/coinbase/rest-hooks/commit/1f8009d9849cfb784f072a1078b4d12b37d59a04))

### 📝 Documentation

- Random improvements and robots.txt again ([#2318](https://github.com/coinbase/rest-hooks/issues/2318)) ([b146f82](https://github.com/coinbase/rest-hooks/commit/b146f821f4cef623d410692449555190deb9a9e0))

### [7.1.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.1.0...@rest-hooks/react@7.1.1) (2022-12-05)

### 💅 Enhancement

- Block dispatches after unmount ([#2307](https://github.com/coinbase/rest-hooks/issues/2307)) ([55af3e6](https://github.com/coinbase/rest-hooks/commit/55af3e693c310f81511b254c1c2451d3bcbd7342))
- Include Object.hasOwn polyfill ([#2309](https://github.com/coinbase/rest-hooks/issues/2309)) ([14b93f6](https://github.com/coinbase/rest-hooks/commit/14b93f67f0589df5813909e0c1acd4cacad0a3ee))

### 📦 Package

- Update babel packages ([#2308](https://github.com/coinbase/rest-hooks/issues/2308)) ([e3ee5ee](https://github.com/coinbase/rest-hooks/commit/e3ee5ee57431971ba4bdb47b48ed89933412374c))

### 📝 Documentation

- Lots of fixes ([#2295](https://github.com/coinbase/rest-hooks/issues/2295)) ([2d151e8](https://github.com/coinbase/rest-hooks/commit/2d151e824bac674f35b20f684defffd26c1409a1))

## [7.1.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@7.0.0...@rest-hooks/react@7.1.0) (2022-11-22)

### 🚀 Features

- Add LogoutManager ([e9e10a8](https://github.com/coinbase/rest-hooks/commit/e9e10a88df2bbc36bfaf3498c00cc35b657ada8f))
- Add useLive() ([#2287](https://github.com/coinbase/rest-hooks/issues/2287)) ([e1623f9](https://github.com/coinbase/rest-hooks/commit/e1623f9868a6ab7e7799ef386a087468f8b6e006))
- Make Controller the middleware API ([#2290](https://github.com/coinbase/rest-hooks/issues/2290)) ([0f0302d](https://github.com/coinbase/rest-hooks/commit/0f0302d6e95faea67cc3283bc013de06b9dcc840))
- **react-native:** Sub/unsub based on react-navigation focus ([#2291](https://github.com/coinbase/rest-hooks/issues/2291)) ([efc926f](https://github.com/coinbase/rest-hooks/commit/efc926f0a1036d98063c80b98d24338209f21c18))

### 📝 Documentation

- Add nextjs demo ([b650618](https://github.com/coinbase/rest-hooks/commit/b6506180ef41a73eb4c926eef3786e0394c3a2c3))
- Add useLive() docs ([3917c1c](https://github.com/coinbase/rest-hooks/commit/3917c1c3490794d0a7a987c7d6b3a255b25943ee))

## [7.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@6.0.0...@rest-hooks/react@7.0.0) (2022-11-16)

### ⚠ 💥 BREAKING CHANGES

- Hooks may fetch more than previously

### 🚀 Features

- Revalidate on react-navigation focus for useFetch() ([6eba85a](https://github.com/coinbase/rest-hooks/commit/6eba85a80aef919b066650e3a7f6ff38af831f8b))

### [0.2.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/react@0.2.0...@rest-hooks/react@0.2.1) (2022-11-13)

### 📝 Documentation

- Update badge links ([e79c685](https://github.com/coinbase/rest-hooks/commit/e79c6853e9414127c6eeaee784dc3f33546b9630))

## 0.2.0 (2022-11-13)

### 🚀 Features

- Add packages react and redux ([#2270](https://github.com/coinbase/rest-hooks/issues/2270)) ([6e28f5f](https://github.com/coinbase/rest-hooks/commit/6e28f5f465b6f4f5d444b56234f212863aeade31))
