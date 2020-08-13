# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.0.0-k.2 (2020-08-13)

**Note:** Version bump only for package @rest-hooks/core





## 1.0.0-k.1 (2020-08-12)

* enhance: Support React 17 (#397) ([a833f07](https://github.com/coinbase/rest-hooks/commit/a833f07)), closes [#397](https://github.com/coinbase/rest-hooks/issues/397)





## 1.0.0-k.0 (2020-08-09)

* feat: Add @rest-hooks/hooks for composable utilities (#393) ([b225a2a](https://github.com/coinbase/rest-hooks/commit/b225a2a)), closes [#393](https://github.com/coinbase/rest-hooks/issues/393)
* feat: Simple AbortController integration (#392) ([899563d](https://github.com/coinbase/rest-hooks/commit/899563d)), closes [#392](https://github.com/coinbase/rest-hooks/issues/392)





## 1.0.0-j.7 (2020-08-09)

* enhance: console instead of throw when missing frequency ([8708b1f](https://github.com/coinbase/rest-hooks/commit/8708b1f))
* fix: extend() correctly keeps options for FetchShape compat ([bf522a2](https://github.com/coinbase/rest-hooks/commit/bf522a2))





## 1.0.0-j.6 (2020-08-09)

* enhance: Simplify endpoint memoization and provide new extensions (#391) ([d874d0b](https://github.com/coinbase/rest-hooks/commit/d874d0b)), closes [#391](https://github.com/coinbase/rest-hooks/issues/391)
* fix: Resource endpoint memoization ([744431e](https://github.com/coinbase/rest-hooks/commit/744431e))





## 1.0.0-j.5 (2020-08-08)

* internal: Test using endpoints directly (#389) ([bb0e8fd](https://github.com/coinbase/rest-hooks/commit/bb0e8fd)), closes [#389](https://github.com/coinbase/rest-hooks/issues/389)
* feat: Support extra endpoint members and inheritance (#387) ([6ad5486](https://github.com/coinbase/rest-hooks/commit/6ad5486)), closes [#387](https://github.com/coinbase/rest-hooks/issues/387)





## 1.0.0-j.4 (2020-08-04)

* fix: Handle entities updated with new indexes (#384) ([2ee3bb6](https://github.com/coinbase/rest-hooks/commit/2ee3bb6)), closes [#384](https://github.com/coinbase/rest-hooks/issues/384)
* fix: Infer useFetcher() has no body when not present in fetch (#385) ([22dd399](https://github.com/coinbase/rest-hooks/commit/22dd399)), closes [#385](https://github.com/coinbase/rest-hooks/issues/385)





## 1.0.0-j.3 (2020-07-31)

**Note:** Version bump only for package @rest-hooks/core





## 1.0.0-j.2 (2020-07-27)

**Note:** Version bump only for package @rest-hooks/core





## 1.0.0-j.1 (2020-07-27)

* fix: Inferred return of useCache() (#377) ([ce7a4f7](https://github.com/coinbase/rest-hooks/commit/ce7a4f7)), closes [#377](https://github.com/coinbase/rest-hooks/issues/377)





## 1.0.0-j.0 (2020-07-27)

* feat: Add @rest-hooks/rest package (#375) ([5e5c125](https://github.com/coinbase/rest-hooks/commit/5e5c125)), closes [#375](https://github.com/coinbase/rest-hooks/issues/375)





## 1.0.0-i.4 (2020-07-22)

* internal: Add add more disruption to referntial test ([f249b40](https://github.com/coinbase/rest-hooks/commit/f249b40))
* docs: Add link to debugging docs from readme ([d75cbe8](https://github.com/coinbase/rest-hooks/commit/d75cbe8))





## 1.0.0-i.3 (2020-07-21)

* internal: Fix - in test make date of fetch consistent ([d9b5970](https://github.com/coinbase/rest-hooks/commit/d9b5970))
* internal: Fix remaining types in test ([b599927](https://github.com/coinbase/rest-hooks/commit/b599927))
* internal: Fix tests ([78332b3](https://github.com/coinbase/rest-hooks/commit/78332b3))
* feat: Add fetch request creation time to meta ([1a6242f](https://github.com/coinbase/rest-hooks/commit/1a6242f))





## 1.0.0-i.2 (2020-07-20)

* feat: Add DevToolsManager to integrate with redux-devtools (#371) ([aa171bc](https://github.com/coinbase/rest-hooks/commit/aa171bc)), closes [#371](https://github.com/coinbase/rest-hooks/issues/371)
* enhance: Add more information when network receive fails ([67ead66](https://github.com/coinbase/rest-hooks/commit/67ead66))
* docs: Fix Endpoint def in readme example ([125ad57](https://github.com/coinbase/rest-hooks/commit/125ad57))
* docs: Update readme tagline ([fe39b16](https://github.com/coinbase/rest-hooks/commit/fe39b16))





## 1.0.0-i.1 (2020-07-14)

* fix: Export Endpoint through core ([8b60dea](https://github.com/coinbase/rest-hooks/commit/8b60dea))





## 1.0.0-i.0 (2020-07-14)

* docs: Update readme examples ([68c69ab](https://github.com/coinbase/rest-hooks/commit/68c69ab))
* enhance: Make Endpoint compatible with FetchShape ([caa967c](https://github.com/coinbase/rest-hooks/commit/caa967c))
* enhance: Resource uses endpoint (#365) ([4472106](https://github.com/coinbase/rest-hooks/commit/4472106)), closes [#365](https://github.com/coinbase/rest-hooks/issues/365)


### BREAKING CHANGE

* getFetchOptions() -> getEndpointExtra()




## 1.0.0-h.0 (2020-07-13)

* pkg: Bump babel runtime ([c6bf844](https://github.com/coinbase/rest-hooks/commit/c6bf844))
* docs: Fix tags ([987f0ed](https://github.com/coinbase/rest-hooks/commit/987f0ed))
* docs: Remove irrelevant tags ([ff137da](https://github.com/coinbase/rest-hooks/commit/ff137da))





## 1.0.0-delta.0 (2020-07-08)

* feat: Deletes and invalidates trigger suspense always (#360) ([96175ba](https://github.com/coinbase/rest-hooks/commit/96175ba)), closes [#360](https://github.com/coinbase/rest-hooks/issues/360)
* feat: Resource.fetch() arguments reflect browser fetch() (#362) ([1d19421](https://github.com/coinbase/rest-hooks/commit/1d19421)), closes [#362](https://github.com/coinbase/rest-hooks/issues/362)


### BREAKING CHANGE

* - denormalize has third boolean value to track deletion
- deletes no long remove entities, but replace them with DELETE symbol (exported from normalizr)
- schema of delete shape should be the `new schemas.Delete()`
- useInvalidator()'s function calls will always suspend - even without invalidIfStale
- deleted entities that are required by a useResource() will now cause it to suspend rather than throwing `404`
- required entities missing from network response will now throw error in useResource() just like other unexpected deserializations
- FetchShape type is now just 'read' | 'mutate'. No more 'delete'. (use schema.Delete())
* - Removed Resource.fetchOptionsPlugin()
- Added Resource.getFetchInit() which is called in shape generators
- Resourece.fetch() interface changed to match browser fetch()




## 1.0.0-gamma.0 (2020-06-13)

**Note:** Version bump only for package @rest-hooks/core





## 1.0.0-beta.15 (2020-06-13)

* feat: Declarative schema deserialization (#355) ([9dbb019](https://github.com/coinbase/rest-hooks/commit/9dbb019)), closes [#355](https://github.com/coinbase/rest-hooks/issues/355)





## 1.0.0-beta.14 (2020-06-09)

* fix: Clear invalidIfStale protections on mount (#357) ([b9a89dc](https://github.com/coinbase/rest-hooks/commit/b9a89dc)), closes [#357](https://github.com/coinbase/rest-hooks/issues/357)
* internal: Add tests for malformed network responses ([96b788a](https://github.com/coinbase/rest-hooks/commit/96b788a))





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
