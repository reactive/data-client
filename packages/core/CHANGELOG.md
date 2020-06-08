# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.0.0-beta.13 (2020-06-08)

* fix: Looping fetches should still expire at some point ([ef560a9](https://github.com/coinbase/rest-hooks/commit/ef560a9))





## 1.0.0-beta.12 (2020-06-06)

* fix: Normalizr errors reject and throw in useResource() (#352) ([1596b22](https://github.com/coinbase/rest-hooks/commit/1596b22)), closes [#352](https://github.com/coinbase/rest-hooks/issues/352)
* fix: Protect against invalidIfStale with || request (#354) ([13f91d3](https://github.com/coinbase/rest-hooks/commit/13f91d3)), closes [#354](https://github.com/coinbase/rest-hooks/issues/354)
* docs: Update @rest-hooks/core readme with Entity ([21e9d2e](https://github.com/coinbase/rest-hooks/commit/21e9d2e))
* internal: Add additional type test for useFetcher() ([2f5c876](https://github.com/coinbase/rest-hooks/commit/2f5c876))
* internal: Prepare tests to run in React Native env (#309) ([64efd70](https://github.com/coinbase/rest-hooks/commit/64efd70)), closes [#309](https://github.com/coinbase/rest-hooks/issues/309)





## [1.0.0-beta.11](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.10...@rest-hooks/core@1.0.0-beta.11) (2020-05-20)


### 🏠 Internal

* Bump typescript patch and get rid of comment ([17174ea](https://github.com/coinbase/rest-hooks/commit/17174ea13577571db1c1d2f2d3d7e7f64ea1ed57))



## [1.0.0-beta.10](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.9...@rest-hooks/core@1.0.0-beta.10) (2020-05-20)


### 🐛 Bug Fix

* Inferred return type of useFetcher() should be promise ([18f5654](https://github.com/coinbase/rest-hooks/commit/18f565491eecd69aa4b76774937e7dfd82822788))



## [1.0.0-beta.9](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.8...@rest-hooks/core@1.0.0-beta.9) (2020-05-20)


### 💅 Enhancement

* Infer a reasonble type for fetch responses by default ([9d8c44c](https://github.com/coinbase/rest-hooks/commit/9d8c44cf2dfc085a8d5ad16fcc14095849283c68))


### 🐛 Bug Fix

* Accept null as payload of fetch ([4ff4d06](https://github.com/coinbase/rest-hooks/commit/4ff4d0662e73e053746e7491cf946c55d71baf52))
* SimpleRecord as schema in useDenormalized() ([#346](https://github.com/coinbase/rest-hooks/issues/346)) ([2b96335](https://github.com/coinbase/rest-hooks/commit/2b96335d2758b67fa5616fdafb6b338c8128c9a2))
* useFetcher() return types ([#347](https://github.com/coinbase/rest-hooks/issues/347)) ([d921cbe](https://github.com/coinbase/rest-hooks/commit/d921cbe41dc4b0d3f2c80bb9b6ef99dc71a8a86d))



## [1.0.0-beta.8](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.7...@rest-hooks/core@1.0.0-beta.8) (2020-05-19)

**Note:** Version bump only for package @rest-hooks/core





## [1.0.0-beta.7](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.6...@rest-hooks/core@1.0.0-beta.7) (2020-05-19)

**Note:** Version bump only for package @rest-hooks/core





## [1.0.0-beta.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.5...@rest-hooks/core@1.0.0-beta.6) (2020-05-19)


### 🐛 Bug Fix

* No entity schemas should suspend when they have no results ([#344](https://github.com/coinbase/rest-hooks/issues/344)) ([d3cd45e](https://github.com/coinbase/rest-hooks/commit/d3cd45e03bd639c49bf010ff848d4a158f0e6bf9))



## [1.0.0-beta.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.4...@rest-hooks/core@1.0.0-beta.5) (2020-05-14)


### 📝 Documentation

* Get rid of all references to asSchema() ([#339](https://github.com/coinbase/rest-hooks/issues/339)) ([01b878b](https://github.com/coinbase/rest-hooks/commit/01b878b85f7469a12e19912efc696a424663e5f5))



## [1.0.0-beta.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.3...@rest-hooks/core@1.0.0-beta.4) (2020-05-13)

**Note:** Version bump only for package @rest-hooks/core





## [1.0.0-beta.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.2...@rest-hooks/core@1.0.0-beta.3) (2020-05-13)


### 💅 Enhancement

* Add back remaining normalizr exports to rest-hooks ([b6878ee](https://github.com/coinbase/rest-hooks/commit/b6878eebbf1572a4b859828da81a058bc5c118e3))


### 📦 Package

* Add type exports: Normalize, Denormalize, and their nullables ([378078f](https://github.com/coinbase/rest-hooks/commit/378078f543526047ad76251e1ef73ae5899eaaf5))



## [1.0.0-beta.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/core@1.0.0-beta.1...@rest-hooks/core@1.0.0-beta.2) (2020-05-13)

**Note:** Version bump only for package @rest-hooks/core





## 1.0.0-beta.1 (2020-05-12)


### 💅 Enhancement

* New package @rest-hooks/core ([#336](https://github.com/coinbase/rest-hooks/issues/336)) ([bf490c0](https://github.com/coinbase/rest-hooks/commit/bf490c030feb8a0e35e96c6dd7d180e45ac8bfd0))
