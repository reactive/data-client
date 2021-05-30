# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.1.4...@rest-hooks/test@5.0.0) (2021-05-30)


### ⚠ 💥 BREAKING CHANGES

* - requires node 12
- 'suppressErrorOutput will now work when explicitly called, even if the
    RHTL_DISABLE_ERROR_FILTERING env variable has been set' (from
    react-hooks-testing-library)

### 📦 Package

* react-hooks-testing-library v7 ([#866](https://github.com/coinbase/rest-hooks/issues/866)) ([249883b](https://github.com/coinbase/rest-hooks/commit/249883b11624d1adbd440fbbb96f597a81162857))


### 🏠 Internal

* Major version bump ([#874](https://github.com/coinbase/rest-hooks/issues/874)) ([37931f3](https://github.com/coinbase/rest-hooks/commit/37931f331a08268fb12f752f26f3281b0cb11adf))



### [4.1.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.1.3...@rest-hooks/test@4.1.4) (2021-05-24)

**Note:** Version bump only for package @rest-hooks/test





### [4.1.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.1.2...@rest-hooks/test@4.1.3) (2021-04-26)


### 🐛 Bug Fix

* useMeta() parameters type ([#775](https://github.com/coinbase/rest-hooks/issues/775)) ([9f7fae4](https://github.com/coinbase/rest-hooks/commit/9f7fae4dba0d797fdfac114e52cdd5ea90f4d61f))



### [4.1.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.1.1...@rest-hooks/test@4.1.2) (2021-04-24)


### 💅 Enhancement

* Support TypeScript 3.7 ([#752](https://github.com/coinbase/rest-hooks/issues/752)) ([68a10e0](https://github.com/coinbase/rest-hooks/commit/68a10e06dc0718f5e480097e6056a7a7954d1161))



### [4.1.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.1.0...@rest-hooks/test@4.1.1) (2021-03-14)


### 📝 Documentation

* Update package tags ([#650](https://github.com/coinbase/rest-hooks/issues/650)) ([4ef465a](https://github.com/coinbase/rest-hooks/commit/4ef465a129cd59668cd9c3542bb9ec03c84d2a4d))



## [4.1.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.0.1...@rest-hooks/test@4.1.0) (2021-03-10)


### 🚀 Features

* Rely on mapMiddleware for redux testing ([#648](https://github.com/coinbase/rest-hooks/issues/648)) ([43dca21](https://github.com/coinbase/rest-hooks/commit/43dca21dedd8e7379c5a8305a48001ee80db3d7c))


### 🐛 Bug Fix

* Redux-integration needs state selection in middlewares: mapMiddleware() ([#643](https://github.com/coinbase/rest-hooks/issues/643)) ([a0f92eb](https://github.com/coinbase/rest-hooks/commit/a0f92eb5bd62a04bf92214c6cf3b6282048e723e))



### [4.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@4.0.0...@rest-hooks/test@4.0.1) (2021-03-08)


### 🐛 Bug Fix

* Explicit extensions for ESM ([#628](https://github.com/coinbase/rest-hooks/issues/628)) ([ece85e4](https://github.com/coinbase/rest-hooks/commit/ece85e4e96f446afcfdacc76e03891848a4c6fd4))



## [4.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@3.0.1...@rest-hooks/test@4.0.0) (2021-03-01)


### ⚠ 💥 BREAKING CHANGES

* - Requires node 10+ (and not node 13 less than 13.7)
- No nested exports - only allowed usage:
  - `import { /* something */ } from '@rest-hooks/test';`
  - `import packageJson from '@rest-hooks/test/package.json';`

### 💅 Enhancement

* Define package exports for modern tooling ([#590](https://github.com/coinbase/rest-hooks/issues/590)) ([5a3e00b](https://github.com/coinbase/rest-hooks/commit/5a3e00b26451c6d0a480925f5f1ab7099a7aedeb))



### [3.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@3.0.0...@rest-hooks/test@3.0.1) (2021-02-23)


### 🐛 Bug Fix

* Gracefully handle webpack builds ([#551](https://github.com/coinbase/rest-hooks/issues/551)) ([d53a2a1](https://github.com/coinbase/rest-hooks/commit/d53a2a181d27077e4da9cd6152bbee116fbca1ad))


### 📝 Documentation

* Link improvements, flesh out test readme ([#511](https://github.com/coinbase/rest-hooks/issues/511)) ([9cab431](https://github.com/coinbase/rest-hooks/commit/9cab431803a8b7d9c18e02b3e9cb7e336215ccdb))
* Typo fix + better test example ([#512](https://github.com/coinbase/rest-hooks/issues/512)) ([70c29ac](https://github.com/coinbase/rest-hooks/commit/70c29ac472ee88227da32ea6ffdddebfff813b99))



## [3.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@2.0.1...@rest-hooks/test@3.0.0) (2021-01-31)


### ⚠ 💥 BREAKING CHANGES

* - result.current, result.error is now `undefined` after suspense, rather than `null`
-  interval will now default to 50ms in async utils
-  timeout will now default to 1000ms in async utils
-  suppressErrors has been removed from async utils
- Adjust types so that react renderer exports don't required extra generic parameter
- Importing from renderHook and act from @testing-library/react-hooks will now auto-detect which renderer to used based on the project's dependencies
    - peerDependencies are now optional to support different dependencies being required
    - This means there will be no warning if the dependency is not installed at all, but it will still warn if an incompatible version is installed
    - Auto-detection won't work with bundlers (e.g. Webpack). Please use as specific renderer import instead
(see https://github.com/testing-library/react-hooks-testing-library/releases/tag/v5.0.0)

### 📦 Package

* react-hooks-testing-library major ([#497](https://github.com/coinbase/rest-hooks/issues/497)) ([e6a5210](https://github.com/coinbase/rest-hooks/commit/e6a5210f066dddcad065c3737dbfb9ac8f9e8d89))


### 📝 Documentation

* Update readme for test pkg ([#509](https://github.com/coinbase/rest-hooks/issues/509)) ([55afd72](https://github.com/coinbase/rest-hooks/commit/55afd72a1a859bdac2139589a3e4f061d06bea0e))



### [2.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@2.0.0...@rest-hooks/test@2.0.1) (2021-01-24)


### 🐛 Bug Fix

* Disallow breaking 3.6 version of @testing-library/react-hooks ([#498](https://github.com/coinbase/rest-hooks/issues/498)) ([b3b057b](https://github.com/coinbase/rest-hooks/commit/b3b057bdbe5f2da6ce2a55a7129989e3f9d7b30b))
* MockResolver intercepts subscriptions matching fixtures ([#490](https://github.com/coinbase/rest-hooks/issues/490)) ([63e631f](https://github.com/coinbase/rest-hooks/commit/63e631ffa66505cba290723ce4dd773fe9be4a26))



## 2.0.0 (2021-01-19)


### ⚠ 💥 BREAKING CHANGES

* Action creator arguments changed
Mutates produce the same action type as 'read's
* url -> key on all action.meta
Testing lib now relies on new export in rest-hooks 5

### 🚀 Features

* Add <MockResolver /> ([#446](https://github.com/coinbase/rest-hooks/issues/446)) ([614576a](https://github.com/coinbase/rest-hooks/commit/614576ac051b1d82e4181bd4278d4f6a16b82ab8))


### 💅 Enhancement

* New package @rest-hooks/core ([#336](https://github.com/coinbase/rest-hooks/issues/336)) ([bf490c0](https://github.com/coinbase/rest-hooks/commit/bf490c030feb8a0e35e96c6dd7d180e45ac8bfd0))
* Print the action in mockDispatch, so users know what they need to mock. ([#373](https://github.com/coinbase/rest-hooks/issues/373)) ([18a7628](https://github.com/coinbase/rest-hooks/commit/18a7628ddf252f8372bc93764391c2fc8719b832))
* Refine action creator interface ([#327](https://github.com/coinbase/rest-hooks/issues/327)) ([8cdc119](https://github.com/coinbase/rest-hooks/commit/8cdc1198a37d1a253e1b7a9a54aec2ab76eddaaa))
* Rename action.meta.url to 'key' ([#325](https://github.com/coinbase/rest-hooks/issues/325)) ([5a06fe4](https://github.com/coinbase/rest-hooks/commit/5a06fe4d1799f0d8806b57d6929813e00a23cffd))
* Support React 17 ([#397](https://github.com/coinbase/rest-hooks/issues/397)) ([a833f07](https://github.com/coinbase/rest-hooks/commit/a833f0724c60fbb2dd3ff6d7d791ee53c3eff694))


### 🐛 Bug Fix

* Improve Wrapper types ([b30321d](https://github.com/coinbase/rest-hooks/commit/b30321dc3d06ae548aeaebcc797ab6fe64eaee40))
* Only block suspense if errors are synthetic ([#410](https://github.com/coinbase/rest-hooks/issues/410)) ([af8ab26](https://github.com/coinbase/rest-hooks/commit/af8ab267e4fab27e714e38e0ff9bc4cbf17069ad))
* Only console fetch dispatches ([4b3e046](https://github.com/coinbase/rest-hooks/commit/4b3e04662309e2cd9dc636e80337e0f15bc1f95a))
* Rest Hooks beta peerdep ([43ef2a1](https://github.com/coinbase/rest-hooks/commit/43ef2a16043207d7e52ae31b008b87d28fac0151))
* Test types ([17fe727](https://github.com/coinbase/rest-hooks/commit/17fe72731506713a28361b126527a6f3a08d3194))
* Test types ([#379](https://github.com/coinbase/rest-hooks/issues/379)) ([f4353d9](https://github.com/coinbase/rest-hooks/commit/f4353d964e41acd51e75e016d910448a7613990e))
* Testing should be using context from @rest-hooks/core in cjs ([cf84798](https://github.com/coinbase/rest-hooks/commit/cf8479888638b78f36bd2ba1396ba372f4df70a5))


### 📝 Documentation

* Improve readme for new packages ([2406f2c](https://github.com/coinbase/rest-hooks/commit/2406f2c78a10e41f6aa1e7deeb4c957a3c94314d))


## 2.0.0-k.2 (2021-01-06)

* enhance: Remove FixtureManager in favor of MockResolver (#447) ([4aa1617](https://github.com/coinbase/rest-hooks/commit/4aa1617)), closes [#447](https://github.com/coinbase/rest-hooks/issues/447)
* feat: Add <MockResolver /> (#446) ([614576a](https://github.com/coinbase/rest-hooks/commit/614576a)), closes [#446](https://github.com/coinbase/rest-hooks/issues/446)
* feat: Add FixtureNetworkManager to provide fixtures for imperative fetch ([0d015dc](https://github.com/coinbase/rest-hooks/commit/0d015dc))
* fix: FixtureManager should dispatch receive async to not break react (#445) ([e1645cb](https://github.com/coinbase/rest-hooks/commit/e1645cb)), closes [#445](https://github.com/coinbase/rest-hooks/issues/445)





## 2.0.0-k.1 (2020-09-08)

* fix: Only block suspense if errors are synthetic (#410) ([af8ab26](https://github.com/coinbase/rest-hooks/commit/af8ab26)), closes [#410](https://github.com/coinbase/rest-hooks/issues/410)
* fix: Only console fetch dispatches ([4b3e046](https://github.com/coinbase/rest-hooks/commit/4b3e046))





## 2.0.0-k.0 (2020-08-12)

* enhance: Support React 17 (#397) ([a833f07](https://github.com/coinbase/rest-hooks/commit/a833f07)), closes [#397](https://github.com/coinbase/rest-hooks/issues/397)





## 2.0.0-j.2 (2020-08-09)

* fix: Improve Wrapper types ([b30321d](https://github.com/coinbase/rest-hooks/commit/b30321d))





## 2.0.0-j.1 (2020-07-31)

* fix: Test types ([17fe727](https://github.com/coinbase/rest-hooks/commit/17fe727))
* fix: Test types (#379) ([f4353d9](https://github.com/coinbase/rest-hooks/commit/f4353d9)), closes [#379](https://github.com/coinbase/rest-hooks/issues/379)





## 2.0.0-j.0 (2020-07-27)

* enhance: Print the action in mockDispatch, so users know what they need to mock. (#373) ([18a7628](https://github.com/coinbase/rest-hooks/commit/18a7628)), closes [#373](https://github.com/coinbase/rest-hooks/issues/373)





## [2.0.0-beta.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@2.0.0-beta.1...@rest-hooks/test@2.0.0-beta.2) (2020-05-13)


### 🐛 Bug Fix

* Testing should be using context from @rest-hooks/core in cjs ([cf84798](https://github.com/coinbase/rest-hooks/commit/cf8479888638b78f36bd2ba1396ba372f4df70a5))



## [2.0.0-beta.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@2.0.0-beta.0...@rest-hooks/test@2.0.0-beta.1) (2020-05-12)


### 💅 Enhancement

* New package @rest-hooks/core ([#336](https://github.com/coinbase/rest-hooks/issues/336)) ([bf490c0](https://github.com/coinbase/rest-hooks/commit/bf490c030feb8a0e35e96c6dd7d180e45ac8bfd0))



## [2.0.0-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.18...@rest-hooks/test@2.0.0-beta.0) (2020-05-04)


### ⚠ 💥 BREAKING CHANGES

* Action creator arguments changed
Mutates produce the same action type as 'read's
* url -> key on all action.meta
Testing lib now relies on new export in rest-hooks 5

### 💅 Enhancement

* Refine action creator interface ([#327](https://github.com/coinbase/rest-hooks/issues/327)) ([8cdc119](https://github.com/coinbase/rest-hooks/commit/8cdc1198a37d1a253e1b7a9a54aec2ab76eddaaa))
* Rename action.meta.url to 'key' ([#325](https://github.com/coinbase/rest-hooks/issues/325)) ([5a06fe4](https://github.com/coinbase/rest-hooks/commit/5a06fe4d1799f0d8806b57d6929813e00a23cffd))


### 🐛 Bug Fix

* Rest Hooks beta peerdep ([43ef2a1](https://github.com/coinbase/rest-hooks/commit/43ef2a16043207d7e52ae31b008b87d28fac0151))



### [1.0.18](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.17...@rest-hooks/test@1.0.18) (2020-04-26)


### 🐛 Bug Fix

* Make expiry time more testable and realistic ([5878998](https://github.com/coinbase/rest-hooks/commit/58789981ce54eb9718d704451285e48fa0b977cb))



### [1.0.17](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.16...@rest-hooks/test@1.0.17) (2020-03-22)


### 🏠 Internal

* Update eslint-plugin + prettier 2 ([#304](https://github.com/coinbase/rest-hooks/issues/304)) ([210eabc](https://github.com/coinbase/rest-hooks/commit/210eabcec4651f3150658535df6dce730bf7665e))



### [1.0.16](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.15...@rest-hooks/test@1.0.16) (2020-03-13)


### 💅 Enhancement

* MockProvider with mismatched fixtures console message ([#295](https://github.com/coinbase/rest-hooks/issues/295)) ([121bb10](https://github.com/coinbase/rest-hooks/commit/121bb109d456dba58fec41ea73c6924223942e71))



### [1.0.15](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.14...@rest-hooks/test@1.0.15) (2020-03-08)


### 🏠 Internal

* Only allow building types from root ([0c3d7ae](https://github.com/coinbase/rest-hooks/commit/0c3d7ae1a9d6130848f31850ed8b15e6ed01d0ab))



### [1.0.14](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.14-beta.0...@rest-hooks/test@1.0.14) (2020-02-18)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.14-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.13...@rest-hooks/test@1.0.14-beta.0) (2020-02-18)


### 🐛 Bug Fix

* Poll fetches while testing should be wrapped in act ([#268](https://github.com/coinbase/rest-hooks/issues/268)) ([9c264bb](https://github.com/coinbase/rest-hooks/commit/9c264bb1e5a736b6bdab2077185cebd754c39b6f))


### 🏠 Internal

* Centralize jest config ([#230](https://github.com/coinbase/rest-hooks/issues/230)) ([5d769d2](https://github.com/coinbase/rest-hooks/commit/5d769d2485fe62ba65f4176894768bdbb6faafb3))



### [1.0.13](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.12...@rest-hooks/test@1.0.13) (2020-01-18)


### 🏠 Internal

* Remove devDep of rest-hooks from test ([#241](https://github.com/coinbase/rest-hooks/issues/241)) ([e00fdb6](https://github.com/coinbase/rest-hooks/commit/e00fdb6151a96e3ef6221ce1880a21db0c70320c))



### [1.0.12](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.11...@rest-hooks/test@1.0.12) (2020-01-17)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.11](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.9...@rest-hooks/test@1.0.11) (2020-01-17)


### 🏠 Internal

* Fix test package version ([f3a5a25](https://github.com/coinbase/rest-hooks/commit/f3a5a2507378e810f705b63fcc3ea3cb6869f7a3))



### [1.0.9](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.8...@rest-hooks/test@1.0.9) (2020-01-16)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.8](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.7...@rest-hooks/test@1.0.8) (2020-01-14)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.7](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.6...@rest-hooks/test@1.0.7) (2020-01-06)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.5...@rest-hooks/test@1.0.6) (2020-01-05)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.4...@rest-hooks/test@1.0.5) (2020-01-05)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.3...@rest-hooks/test@1.0.4) (2020-01-05)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.2...@rest-hooks/test@1.0.3) (2019-12-31)

**Note:** Version bump only for package @rest-hooks/test





### [1.0.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.1...@rest-hooks/test@1.0.2) (2019-12-22)


### ⚠ 💥 BREAKING CHANGES

* * fetchPlugin -> fetchOptionsPlugin, which has different signature
* No more SuperagentResource export
* New overridable Resource.resolveFetchData()

### 💅 Enhancement

* Resource.fetch uses fetch instead of superagent ([#199](https://github.com/coinbase/rest-hooks/issues/199)) ([5c740ec](https://github.com/coinbase/rest-hooks/commit/5c740ecf8f864e33cd9a6ab6cbc0a872ba0344ed))


### 🐛 Bug Fix

* Correct peerdepencency version constraints ([ab88e04](https://github.com/coinbase/rest-hooks/commit/ab88e0445f763d0648b39a376340f76a7710c197))


### 🏠 Internal

* Update lint rules ([#206](https://github.com/coinbase/rest-hooks/issues/206)) ([732f875](https://github.com/coinbase/rest-hooks/commit/732f87536e23d6b43cea3abce5be8cd6f1dd75c7))



### [1.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/test@1.0.0...@rest-hooks/test@1.0.1) (2019-12-11)


### 🐛 Bug Fix

* export PromiseifyMiddleware ([#197](https://github.com/coinbase/rest-hooks/issues/197)) ([89370ff](https://github.com/coinbase/rest-hooks/commit/89370ffccaee39a6e147b449a76a1ce9778f7010))


### 📝 Documentation

* Point to repository directory for npm ([942a563](https://github.com/coinbase/rest-hooks/commit/942a563493d35dca9787e541dd89599d2059be1c))



## 1.0.0 (2019-12-02)


### ⚠ 💥 BREAKING CHANGES

* New packages should be ready for 1.0 release
* rest-hooks/test -> @rest-hooks/test

### 💅 Enhancement

* Move testing modules to own package ([#182](https://github.com/coinbase/rest-hooks/issues/182)) ([174461a](https://github.com/coinbase/rest-hooks/commit/174461a3c7568c53842eb6f4ea64e5b85dd20ce5))


### 🏠 Internal

* Centralize babel config & common test ([#189](https://github.com/coinbase/rest-hooks/issues/189)) ([16d22a3](https://github.com/coinbase/rest-hooks/commit/16d22a3ea0dab1b48ae59cdbd3ef8d53c33167f8))
* Use TypeScript project references ([#188](https://github.com/coinbase/rest-hooks/issues/188)) ([412c674](https://github.com/coinbase/rest-hooks/commit/412c6740cd825b06e8784d0d0f4d39e6cb331062))


### 📝 Documentation

* Improve readme for new packages ([2406f2c](https://github.com/coinbase/rest-hooks/commit/2406f2c78a10e41f6aa1e7deeb4c957a3c94314d))



# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/coinbase/rest-hooks/releases) page.
