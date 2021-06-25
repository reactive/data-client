# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.3.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.2.0...@rest-hooks/legacy@2.3.0) (2021-06-25)


### 🚀 Features

* Mark compatibility with upcoming versions ([#959](https://github.com/coinbase/rest-hooks/issues/959)) ([72da158](https://github.com/coinbase/rest-hooks/commit/72da158c19acf4c76b8b86eb37e063956b7347fd))


### 🐛 Bug Fix

* Legacy cjs and unpkg should target 'legacy' ([31b6893](https://github.com/coinbase/rest-hooks/commit/31b68933245bfc6234ecea603618f43af8387729))



## [2.2.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.1.0...@rest-hooks/legacy@2.2.0) (2021-06-16)


### 🚀 Features

* Add Resource+Entity to legacy ([#924](https://github.com/coinbase/rest-hooks/issues/924)) ([0c7ac83](https://github.com/coinbase/rest-hooks/commit/0c7ac834fa1c4fc07665601441422d5170313640))



## [2.1.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.9...@rest-hooks/legacy@2.1.0) (2021-06-13)


### 🚀 Features

* Support React 18 ([#907](https://github.com/coinbase/rest-hooks/issues/907)) ([63e8bc9](https://github.com/coinbase/rest-hooks/commit/63e8bc9887a080e1aa510d972645c037dfc96128))


### 💅 Enhancement

* Use inferResults() from normalizr ([#901](https://github.com/coinbase/rest-hooks/issues/901)) ([875cb6a](https://github.com/coinbase/rest-hooks/commit/875cb6acf31055e37e2d1faf4414bcbf31f5700f))



### [2.0.9](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.8...@rest-hooks/legacy@2.0.9) (2021-06-09)


### 💅 Enhancement

* 'module' entrypoint targets 2019 browsers ([#905](https://github.com/coinbase/rest-hooks/issues/905)) ([d988abe](https://github.com/coinbase/rest-hooks/commit/d988abe063fc67c74fce12e234c9c3ffdb7cc230))



### [2.0.8](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.7...@rest-hooks/legacy@2.0.8) (2021-06-02)


### 💅 Enhancement

* Improve autoimport handling in vscode ([#890](https://github.com/coinbase/rest-hooks/issues/890)) ([f8f2bef](https://github.com/coinbase/rest-hooks/commit/f8f2bef411183676009c6a9df24a26d147c6d9f6))



### [2.0.7](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.6...@rest-hooks/legacy@2.0.7) (2021-05-24)

**Note:** Version bump only for package @rest-hooks/legacy





### [2.0.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.5...@rest-hooks/legacy@2.0.6) (2021-04-24)


### 💅 Enhancement

* Support TypeScript 3.7 ([#752](https://github.com/coinbase/rest-hooks/issues/752)) ([68a10e0](https://github.com/coinbase/rest-hooks/commit/68a10e06dc0718f5e480097e6056a7a7954d1161))



### [2.0.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.4...@rest-hooks/legacy@2.0.5) (2021-03-03)


### 🐛 Bug Fix

* useStatefulResource() return type ([#613](https://github.com/coinbase/rest-hooks/issues/613)) ([05a4995](https://github.com/coinbase/rest-hooks/commit/05a49954c61f47deef18bc5d58d045ac79efd78e))



### [2.0.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.3...@rest-hooks/legacy@2.0.4) (2021-03-01)


### 🐛 Bug Fix

* Rollup name for @rest-hooks/legacy ([#587](https://github.com/coinbase/rest-hooks/issues/587)) ([299c53e](https://github.com/coinbase/rest-hooks/commit/299c53e8eab427d209b6f74babc3602744ea5212))



### [2.0.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.2...@rest-hooks/legacy@2.0.3) (2021-02-27)


### 💅 Enhancement

* Make type discrimination easier in error types ([#581](https://github.com/coinbase/rest-hooks/issues/581)) ([cd105f3](https://github.com/coinbase/rest-hooks/commit/cd105f378e3c97b6accd127a61759287fb8bb3b5))



## [2.0.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.1...@rest-hooks/legacy@2.0.2) (2021-02-24)

### 💅 Enhancement

* Improve error type preciseness ([#571](https://github.com/coinbase/rest-hooks/issues/571)) ([6f760be](https://github.com/coinbase/rest-hooks/commit/6f760be7149f04eb26727730e0ec0d67f2215ed5))


### [2.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.0...@rest-hooks/legacy@2.0.1) (2021-01-24)

**Note:** Version bump only for package @rest-hooks/legacy





## 2.0.0 (2021-01-19)


### ⚠ 💥 BREAKING CHANGES

* useResource() inferred endpoint will sometimes
not trigger a fetch if entities are fresh enough
* - denormalize has third boolean value to track deletion
- deletes no long remove entities, but replace them with DELETE symbol (exported from normalizr)
- schema of delete shape should be the `new schemas.Delete()`
- useInvalidator()'s function calls will always suspend - even without invalidIfStale
- deleted entities that are required by a useResource() will now cause it to suspend rather than throwing `404`
- required entities missing from network response will now throw error in useResource() just like other unexpected deserializations
- FetchShape type is now just 'read' | 'mutate'. No more 'delete'. (use schema.Delete())
* When invalidIfStale is true, useCache() and
useStatefulResource() will no longer return entities, even if they
are in the cache

### 🚀 Features

* Deletes and invalidates trigger suspense always ([#360](https://github.com/coinbase/rest-hooks/issues/360)) ([96175ba](https://github.com/coinbase/rest-hooks/commit/96175ba24d6670d866b315794b039d21fd3ef081))


### 💅 Enhancement

* Inferred endpoints expiry based on entities ([#464](https://github.com/coinbase/rest-hooks/issues/464)) ([975e0d8](https://github.com/coinbase/rest-hooks/commit/975e0d8ce1516d9cd62c00de7f1cce331fd4560a))
* New package @rest-hooks/core ([#336](https://github.com/coinbase/rest-hooks/issues/336)) ([bf490c0](https://github.com/coinbase/rest-hooks/commit/bf490c030feb8a0e35e96c6dd7d180e45ac8bfd0))
* Support React 17 ([#397](https://github.com/coinbase/rest-hooks/issues/397)) ([a833f07](https://github.com/coinbase/rest-hooks/commit/a833f0724c60fbb2dd3ff6d7d791ee53c3eff694))
* useCache() and useStatefulResource() respect invalidIfStale ([#307](https://github.com/coinbase/rest-hooks/issues/307)) ([58f2c40](https://github.com/coinbase/rest-hooks/commit/58f2c40a66fb0d0c1f900840160e17ce87beace2))


### 🐛 Bug Fix

* Catch maybePromise errors. ([#374](https://github.com/coinbase/rest-hooks/issues/374)) ([786b6cc](https://github.com/coinbase/rest-hooks/commit/786b6cc22166d180415a9fb9aa4e8f49d093ad78))
* Rest Hooks beta peerdep ([43ef2a1](https://github.com/coinbase/rest-hooks/commit/43ef2a16043207d7e52ae31b008b87d28fac0151))
* Update rest-hooks peerDep to 5 ([526df3c](https://github.com/coinbase/rest-hooks/commit/526df3c23d7a8be2b3c1ac603d165db26efa0f1b))


### 📦 Package

* Bump babel runtime ([c6bf844](https://github.com/coinbase/rest-hooks/commit/c6bf844fcf1a483988d34b5f09faa03ceff179ec))
* Bump internal pkgs ([#306](https://github.com/coinbase/rest-hooks/issues/306)) ([46bebad](https://github.com/coinbase/rest-hooks/commit/46bebad79d848404d02423fd2a3e2d647ee5bbbb))


## 2.0.0-rc.0 (2021-01-14)

* enhance: Inferred endpoints expiry based on entities (#464) ([975e0d8](https://github.com/coinbase/rest-hooks/commit/975e0d8)), closes [#464](https://github.com/coinbase/rest-hooks/issues/464)


### BREAKING CHANGE

* useResource() inferred endpoint will sometimes
not trigger a fetch if entities are fresh enough




## 2.0.0-k.2 (2021-01-06)

**Note:** Version bump only for package @rest-hooks/legacy





## 2.0.0-k.1 (2020-09-08)

**Note:** Version bump only for package @rest-hooks/legacy





## 2.0.0-k.0 (2020-08-12)

* enhance: Support React 17 (#397) ([a833f07](https://github.com/coinbase/rest-hooks/commit/a833f07)), closes [#397](https://github.com/coinbase/rest-hooks/issues/397)





## 2.0.0-j.2 (2020-08-09)

**Note:** Version bump only for package @rest-hooks/legacy





## 2.0.0-j.1 (2020-07-31)

**Note:** Version bump only for package @rest-hooks/legacy





## 2.0.0-j.0 (2020-07-27)

* fix: Catch maybePromise errors. (#374) ([786b6cc](https://github.com/coinbase/rest-hooks/commit/786b6cc)), closes [#374](https://github.com/coinbase/rest-hooks/issues/374)





## 2.0.0-h.0 (2020-07-13)

* pkg: Bump babel runtime ([c6bf844](https://github.com/coinbase/rest-hooks/commit/c6bf844))





## 2.0.0-delta.0 (2020-07-08)

* feat: Deletes and invalidates trigger suspense always (#360) ([96175ba](https://github.com/coinbase/rest-hooks/commit/96175ba)), closes [#360](https://github.com/coinbase/rest-hooks/issues/360)
* internal: Prepare tests to run in React Native env (#309) ([64efd70](https://github.com/coinbase/rest-hooks/commit/64efd70)), closes [#309](https://github.com/coinbase/rest-hooks/issues/309)


### BREAKING CHANGE

* - denormalize has third boolean value to track deletion
- deletes no long remove entities, but replace them with DELETE symbol (exported from normalizr)
- schema of delete shape should be the `new schemas.Delete()`
- useInvalidator()'s function calls will always suspend - even without invalidIfStale
- deleted entities that are required by a useResource() will now cause it to suspend rather than throwing `404`
- required entities missing from network response will now throw error in useResource() just like other unexpected deserializations
- FetchShape type is now just 'read' | 'mutate'. No more 'delete'. (use schema.Delete())




## [2.0.0-beta.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.0-beta.3...@rest-hooks/legacy@2.0.0-beta.4) (2020-05-13)

**Note:** Version bump only for package @rest-hooks/legacy





## [2.0.0-beta.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.0-beta.2...@rest-hooks/legacy@2.0.0-beta.3) (2020-05-12)


### 💅 Enhancement

* New package @rest-hooks/core ([#336](https://github.com/coinbase/rest-hooks/issues/336)) ([bf490c0](https://github.com/coinbase/rest-hooks/commit/bf490c030feb8a0e35e96c6dd7d180e45ac8bfd0))



## [2.0.0-beta.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@2.0.0-beta.0...@rest-hooks/legacy@2.0.0-beta.2) (2020-05-04)


### 🐛 Bug Fix

* Rest Hooks beta peerdep ([43ef2a1](https://github.com/coinbase/rest-hooks/commit/43ef2a16043207d7e52ae31b008b87d28fac0151))


### 🏠 Internal

* Fix package versions for publish ([06d69ca](https://github.com/coinbase/rest-hooks/commit/06d69ca6d8e8d4dbf847f8a1593bfa65af8d79c6))



## [2.0.0-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.12...@rest-hooks/legacy@2.0.0-beta.0) (2020-04-26)


### ⚠ 💥 BREAKING CHANGES

* When invalidIfStale is true, useCache() and
useStatefulResource() will no longer return entities, even if they
are in the cache

### 💅 Enhancement

* useCache() and useStatefulResource() respect invalidIfStale ([#307](https://github.com/coinbase/rest-hooks/issues/307)) ([58f2c40](https://github.com/coinbase/rest-hooks/commit/58f2c40a66fb0d0c1f900840160e17ce87beace2))


### 🐛 Bug Fix

* Update rest-hooks peerDep to 5 ([526df3c](https://github.com/coinbase/rest-hooks/commit/526df3c23d7a8be2b3c1ac603d165db26efa0f1b))


### 📦 Package

* Bump internal pkgs ([#306](https://github.com/coinbase/rest-hooks/issues/306)) ([46bebad](https://github.com/coinbase/rest-hooks/commit/46bebad79d848404d02423fd2a3e2d647ee5bbbb))


### 🏠 Internal

* Hoist coveralls to root, since testing is done there ([3b1dbaa](https://github.com/coinbase/rest-hooks/commit/3b1dbaac303048a1b1e543f99fb9758b21feb083))
* Update prettier, format files ([88d5627](https://github.com/coinbase/rest-hooks/commit/88d5627fb1963842d2a644cfe06f0780cb3c2dde))



### [1.0.12](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.11...@rest-hooks/legacy@1.0.12) (2020-03-22)


### 🏠 Internal

* Update eslint-plugin + prettier 2 ([#304](https://github.com/coinbase/rest-hooks/issues/304)) ([210eabc](https://github.com/coinbase/rest-hooks/commit/210eabcec4651f3150658535df6dce730bf7665e))



### [1.0.11](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.10...@rest-hooks/legacy@1.0.11) (2020-03-13)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.10](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.9...@rest-hooks/legacy@1.0.10) (2020-03-08)


### 🏠 Internal

* Only allow building types from root ([0c3d7ae](https://github.com/coinbase/rest-hooks/commit/0c3d7ae1a9d6130848f31850ed8b15e6ed01d0ab))



### [1.0.9](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.8...@rest-hooks/legacy@1.0.9) (2020-02-19)


### 🏠 Internal

* Check compressed size changes on PR ([#270](https://github.com/coinbase/rest-hooks/issues/270)) ([d70ccbf](https://github.com/coinbase/rest-hooks/commit/d70ccbf44ac5ba8fdc4f70886851ab18349f37e6))



### [1.0.8](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.8-beta.0...@rest-hooks/legacy@1.0.8) (2020-02-18)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.8-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.7...@rest-hooks/legacy@1.0.8-beta.0) (2020-02-18)


### 🏠 Internal

* Centralize jest config ([#230](https://github.com/coinbase/rest-hooks/issues/230)) ([5d769d2](https://github.com/coinbase/rest-hooks/commit/5d769d2485fe62ba65f4176894768bdbb6faafb3))


### 📝 Documentation

* Use bundlephobia badge for lib size ([eb76258](https://github.com/coinbase/rest-hooks/commit/eb76258db4be81a4a22ce01074c4a88cfc4ff0b8))



### [1.0.7](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.6...@rest-hooks/legacy@1.0.7) (2020-01-18)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.5...@rest-hooks/legacy@1.0.6) (2020-01-17)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.4...@rest-hooks/legacy@1.0.5) (2020-01-06)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.3...@rest-hooks/legacy@1.0.4) (2020-01-05)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.2...@rest-hooks/legacy@1.0.3) (2019-12-31)

**Note:** Version bump only for package @rest-hooks/legacy





### [1.0.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.1...@rest-hooks/legacy@1.0.2) (2019-12-22)


### ⚠ 💥 BREAKING CHANGES

* * fetchPlugin -> fetchOptionsPlugin, which has different signature
* No more SuperagentResource export
* New overridable Resource.resolveFetchData()

### 💅 Enhancement

* Resource.fetch uses fetch instead of superagent ([#199](https://github.com/coinbase/rest-hooks/issues/199)) ([5c740ec](https://github.com/coinbase/rest-hooks/commit/5c740ecf8f864e33cd9a6ab6cbc0a872ba0344ed))


### 🐛 Bug Fix

* Correct peerdepencency version constraints ([37734a8](https://github.com/coinbase/rest-hooks/commit/37734a834b7c87419c744d02cbc17fbe424e4338))


### 📦 Package

* testing ([138c846](https://github.com/coinbase/rest-hooks/commit/138c846035e704d78f751156e5587366310edf98))


### 🏠 Internal

* Update lint rules ([#206](https://github.com/coinbase/rest-hooks/issues/206)) ([732f875](https://github.com/coinbase/rest-hooks/commit/732f87536e23d6b43cea3abce5be8cd6f1dd75c7))



### [1.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/legacy@1.0.0...@rest-hooks/legacy@1.0.1) (2019-12-11)


### 🏠 Internal

* Centralize browserslist config ([b4be6ec](https://github.com/coinbase/rest-hooks/commit/b4be6ecbb3bce3e9c0b465a4de5196c00be351b9))
* fix build:bundle ([9538e19](https://github.com/coinbase/rest-hooks/commit/9538e1932d926179fbcf0c3645a11fadc643e8c1))


### 📝 Documentation

* Point to repository directory for npm ([942a563](https://github.com/coinbase/rest-hooks/commit/942a563493d35dca9787e541dd89599d2059be1c))



## 1.0.0 (2019-12-02)


### ⚠ 💥 BREAKING CHANGES

* New packages should be ready for 1.0 release

### 🚀 Features

* New @rest-hooks/legacy package ([#187](https://github.com/coinbase/rest-hooks/issues/187)) ([78c9321](https://github.com/coinbase/rest-hooks/commit/78c9321f3560d2ea57b4c8478e9bdd789762ae13))


### 📝 Documentation

* Improve readme for new packages ([2406f2c](https://github.com/coinbase/rest-hooks/commit/2406f2c78a10e41f6aa1e7deeb4c957a3c94314d))



# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/coinbase/rest-hooks/releases) page.
