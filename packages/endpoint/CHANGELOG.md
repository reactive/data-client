# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

### [2.0.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@2.0.2...@rest-hooks/endpoint@2.0.3) (2021-10-11)


### 📝 Documentation

* Only validate circleCI badge against master ([#1322](https://github.com/coinbase/rest-hooks/issues/1322)) ([04e9642](https://github.com/coinbase/rest-hooks/commit/04e96426a865cbef362947da3a8f74f7347859e9))



### [2.0.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@2.0.1...@rest-hooks/endpoint@2.0.2) (2021-09-29)

**Note:** Version bump only for package @rest-hooks/endpoint





### [2.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@2.0.0...@rest-hooks/endpoint@2.0.1) (2021-09-29)

**Note:** Version bump only for package @rest-hooks/endpoint





## [2.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@2.0.0-beta.2...@rest-hooks/endpoint@2.0.0) (2021-09-08)

**Note:** Version bump only for package @rest-hooks/endpoint





## [2.0.0-beta.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@2.0.0-beta.1...@rest-hooks/endpoint@2.0.0-beta.2) (2021-09-06)

**Note:** Version bump only for package @rest-hooks/endpoint





## [2.0.0-beta.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.2.3...@rest-hooks/endpoint@2.0.0-beta.1) (2021-07-12)


### ⚠ 💥 BREAKING CHANGES

* * Importing directly from hidden files is no longer supported
* Node>=12
* - Removed: SyntheticError (untriggerable since https://github.com/coinbase/rest-hooks/pull/938)
- @rest-hooks/rest: 500s are 'soft', else 'hard'
- PollingSubscription: any errors are 'soft'
- @rest-hooks/endpoint: no default errorPolicy, therefore all errors are
'hard'
* - fromJS() -> process() to customize init
- normalize results in POJO rather than instances
- FlatEntity, SimpleRecord removed (use @rest-hooks/legacy)
- peerDep @rest-hooks/endpoint > 2

### 🚀 Features

* Add errorPolicy to endpoint options ([#971](https://github.com/coinbase/rest-hooks/issues/971)) ([836f05b](https://github.com/coinbase/rest-hooks/commit/836f05b407b5ac96c8f094e652221aa5a95300b0))
* Use 'exports' package.json member ([#955](https://github.com/coinbase/rest-hooks/issues/955)) ([7e9d39f](https://github.com/coinbase/rest-hooks/commit/7e9d39f15b4b321352ece0caddb93e2c414df8ae))


### 💅 Enhancement

* Different babel targets for cjs and umd builds ([#989](https://github.com/coinbase/rest-hooks/issues/989)) ([f054814](https://github.com/coinbase/rest-hooks/commit/f05481410cf8daa2101d4dbda826e56ad10ec723))
* Entities normalize to POJO ([#940](https://github.com/coinbase/rest-hooks/issues/940)) ([75ebdfe](https://github.com/coinbase/rest-hooks/commit/75ebdfe641ccf57fca35c44a94077e4a314e44d7))
* Give Endpoint.extend() type a name ([#969](https://github.com/coinbase/rest-hooks/issues/969)) ([5afec16](https://github.com/coinbase/rest-hooks/commit/5afec16727f18af6d6acb52b7c0f094555d43e04))
* Remove 'fallback' package.json exports ([#992](https://github.com/coinbase/rest-hooks/issues/992)) ([dc95f9d](https://github.com/coinbase/rest-hooks/commit/dc95f9dbad20d5740218c52c906596b6a3d6eae4))


### 📝 Documentation

* Add doc links to jsdocs ([#966](https://github.com/coinbase/rest-hooks/issues/966)) ([dc7fcfe](https://github.com/coinbase/rest-hooks/commit/dc7fcfec24c30d5f405d24ccc1828620d837ea6b))



## [2.0.0-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.2.2...@rest-hooks/endpoint@2.0.0-beta.0) (2021-06-30)


### ⚠ 💥 BREAKING CHANGES

* * Importing directly from hidden files is no longer supported
* Node>=12
* - Removed: SyntheticError (untriggerable since https://github.com/coinbase/rest-hooks/pull/938)
- @rest-hooks/rest: 500s are 'soft', else 'hard'
- PollingSubscription: any errors are 'soft'
- @rest-hooks/endpoint: no default errorPolicy, therefore all errors are
'hard'
* - fromJS() -> process() to customize init
- normalize results in POJO rather than instances
- FlatEntity, SimpleRecord removed (use @rest-hooks/legacy)
- peerDep @rest-hooks/endpoint > 2

### 🚀 Features

* Add errorPolicy to endpoint options ([#971](https://github.com/coinbase/rest-hooks/issues/971)) ([836f05b](https://github.com/coinbase/rest-hooks/commit/836f05b407b5ac96c8f094e652221aa5a95300b0))
* Use 'exports' package.json member ([#955](https://github.com/coinbase/rest-hooks/issues/955)) ([7e9d39f](https://github.com/coinbase/rest-hooks/commit/7e9d39f15b4b321352ece0caddb93e2c414df8ae))


### 💅 Enhancement

* Different babel targets for cjs and umd builds ([#989](https://github.com/coinbase/rest-hooks/issues/989)) ([f054814](https://github.com/coinbase/rest-hooks/commit/f05481410cf8daa2101d4dbda826e56ad10ec723))
* Entities normalize to POJO ([#940](https://github.com/coinbase/rest-hooks/issues/940)) ([75ebdfe](https://github.com/coinbase/rest-hooks/commit/75ebdfe641ccf57fca35c44a94077e4a314e44d7))
* Give Endpoint.extend() type a name ([#969](https://github.com/coinbase/rest-hooks/issues/969)) ([5afec16](https://github.com/coinbase/rest-hooks/commit/5afec16727f18af6d6acb52b7c0f094555d43e04))
* Remove 'fallback' package.json exports ([#992](https://github.com/coinbase/rest-hooks/issues/992)) ([dc95f9d](https://github.com/coinbase/rest-hooks/commit/dc95f9dbad20d5740218c52c906596b6a3d6eae4))


### 📝 Documentation

* Add doc links to jsdocs ([#966](https://github.com/coinbase/rest-hooks/issues/966)) ([dc7fcfe](https://github.com/coinbase/rest-hooks/commit/dc7fcfec24c30d5f405d24ccc1828620d837ea6b))

### [1.2.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.2.2...@rest-hooks/endpoint@1.2.3) (2021-07-06)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.2.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.2.1...@rest-hooks/endpoint@1.2.2) (2021-06-19)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.2.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.2.0...@rest-hooks/endpoint@1.2.1) (2021-06-16)

**Note:** Version bump only for package @rest-hooks/endpoint





## [1.2.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.6...@rest-hooks/endpoint@1.2.0) (2021-06-13)


### 🚀 Features

* Endpoint.name ([#914](https://github.com/coinbase/rest-hooks/issues/914)) ([aa5f80d](https://github.com/coinbase/rest-hooks/commit/aa5f80db6c47ff975b1d257352315a57b87addce))



### [1.1.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.5...@rest-hooks/endpoint@1.1.6) (2021-06-09)


### 💅 Enhancement

* 'module' entrypoint targets 2019 browsers ([#905](https://github.com/coinbase/rest-hooks/issues/905)) ([d988abe](https://github.com/coinbase/rest-hooks/commit/d988abe063fc67c74fce12e234c9c3ffdb7cc230))



### [1.1.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.3...@rest-hooks/endpoint@1.1.5) (2021-06-02)


### 💅 Enhancement

* Improve autoimport handling in vscode ([#890](https://github.com/coinbase/rest-hooks/issues/890)) ([f8f2bef](https://github.com/coinbase/rest-hooks/commit/f8f2bef411183676009c6a9df24a26d147c6d9f6))



### [1.1.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.3...@rest-hooks/endpoint@1.1.4) (2021-05-30)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.1.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.2...@rest-hooks/endpoint@1.1.3) (2021-05-24)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.1.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.1...@rest-hooks/endpoint@1.1.2) (2021-05-24)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.1.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.1.0...@rest-hooks/endpoint@1.1.1) (2021-04-25)

**Note:** Version bump only for package @rest-hooks/endpoint





## [1.1.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.12...@rest-hooks/endpoint@1.1.0) (2021-04-24)


### 🚀 Features

* Endpoint parameters can be of any length ([#767](https://github.com/coinbase/rest-hooks/issues/767)) ([552f837](https://github.com/coinbase/rest-hooks/commit/552f83740279376288879a661ff487c5c6f1d469))
* Endpoint.bind() ([#762](https://github.com/coinbase/rest-hooks/issues/762)) ([b5ad3dd](https://github.com/coinbase/rest-hooks/commit/b5ad3dd8478bc8edbdfe752080e72024bc1686da))


### 💅 Enhancement

* Support TypeScript 3.7 ([#752](https://github.com/coinbase/rest-hooks/issues/752)) ([68a10e0](https://github.com/coinbase/rest-hooks/commit/68a10e06dc0718f5e480097e6056a7a7954d1161))



### [1.0.12](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.11...@rest-hooks/endpoint@1.0.12) (2021-04-12)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.0.11](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.10...@rest-hooks/endpoint@1.0.11) (2021-04-12)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.0.10](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.9...@rest-hooks/endpoint@1.0.10) (2021-04-04)


### 🐛 Bug Fix

* Endpoint 'type' in loose typescript mode ([#712](https://github.com/coinbase/rest-hooks/issues/712)) ([9ef9c4f](https://github.com/coinbase/rest-hooks/commit/9ef9c4ffc2813a597f15b571f639ad23fd8d6a03))



### [1.0.9](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.8...@rest-hooks/endpoint@1.0.9) (2021-03-26)


### 🐛 Bug Fix

* Compatibility with TypeScript strict: false ([#683](https://github.com/coinbase/rest-hooks/issues/683)) ([8a6e7ed](https://github.com/coinbase/rest-hooks/commit/8a6e7ed4d179555c4ba5cb8957b1c63697a1ce1a))



### [1.0.8](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.7...@rest-hooks/endpoint@1.0.8) (2021-03-24)


### 💅 Enhancement

* Mark Endpoint's back-compat members as 'deprecated' ([#665](https://github.com/coinbase/rest-hooks/issues/665)) ([6feade0](https://github.com/coinbase/rest-hooks/commit/6feade0ad28eb96c7906793b05d49991294ce858))


### 🐛 Bug Fix

* 'type' inferred from 'sideEffects' correct in union case ([#678](https://github.com/coinbase/rest-hooks/issues/678)) ([2cda690](https://github.com/coinbase/rest-hooks/commit/2cda6900cc3c653637452772ec5439a60354b140))



### [1.0.7](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.6...@rest-hooks/endpoint@1.0.7) (2021-03-14)


### 📝 Documentation

* Update package tags ([#650](https://github.com/coinbase/rest-hooks/issues/650)) ([4ef465a](https://github.com/coinbase/rest-hooks/commit/4ef465a129cd59668cd9c3542bb9ec03c84d2a4d))



### [1.0.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.5...@rest-hooks/endpoint@1.0.6) (2021-03-08)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.0.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.4...@rest-hooks/endpoint@1.0.5) (2021-03-03)

**Note:** Version bump only for package @rest-hooks/endpoint





### [1.0.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.3...@rest-hooks/endpoint@1.0.4) (2021-03-01)


### 💅 Enhancement

* Support 'undefined' as schema ([#583](https://github.com/coinbase/rest-hooks/issues/583)) ([1e81470](https://github.com/coinbase/rest-hooks/commit/7ef172a3d8469b182cc7a19055920a308841b59e))


### 🐛 Bug Fix

* Gracefully handle primitive entity responses ([#584](https://github.com/coinbase/rest-hooks/issues/584)) ([322b4c6](https://github.com/coinbase/rest-hooks/commit/322b4c6615ea02b09baf0bcfc9b214bb8be1ba4f))


### 📝 Documentation

* Typos and minor improvements ([#561](https://github.com/coinbase/rest-hooks/issues/561)) ([aed902a](https://github.com/coinbase/rest-hooks/commit/aed902a7ee8a50f7f08fab261efa528a82c52b19))



### [1.0.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.2...@rest-hooks/endpoint@1.0.3) (2021-02-04)


### 📦 Package

* Relax @babel/runtime requirement to ^7.7.2 ([#513](https://github.com/coinbase/rest-hooks/issues/513)) ([cc95b21](https://github.com/coinbase/rest-hooks/commit/cc95b219fbddebfbf334728887ca6d2fa070fce1))


### 📝 Documentation

* Link improvements, flesh out test readme ([#511](https://github.com/coinbase/rest-hooks/issues/511)) ([9cab431](https://github.com/coinbase/rest-hooks/commit/9cab431803a8b7d9c18e02b3e9cb7e336215ccdb))



### [1.0.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.1...@rest-hooks/endpoint@1.0.2) (2021-01-30)


### 🐛 Bug Fix

* Ensure Endpoint doesn't trigger CSP ([#505](https://github.com/coinbase/rest-hooks/issues/505)) ([a5a0011](https://github.com/coinbase/rest-hooks/commit/a5a00119c8888ce5c0440d2045febd9985fd2a8e))



### [1.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@1.0.0...@rest-hooks/endpoint@1.0.1) (2021-01-24)

**Note:** Version bump only for package @rest-hooks/endpoint





## 1.0.0 (2021-01-19)


### ⚠ 💥 BREAKING CHANGES

* Remove `normalize`, `denormalize`; use
`normalizr` package for those
* getFetchOptions() -> getEndpointExtra()

### 🚀 Features

* Add @rest-hooks/endpoint package ([#359](https://github.com/coinbase/rest-hooks/issues/359)) ([642bb1a](https://github.com/coinbase/rest-hooks/commit/642bb1a206ce80bae627574f6b1beacf34be3293))
* Add @rest-hooks/rest package ([#375](https://github.com/coinbase/rest-hooks/issues/375)) ([5e5c125](https://github.com/coinbase/rest-hooks/commit/5e5c125d3396ebbb8514aea6fc80b4dfceb0da27))
* Infer return type from schema ([2dccff4](https://github.com/coinbase/rest-hooks/commit/2dccff44042db4b2869e851156d4363fdd9cc764))
* Simple AbortController integration ([#392](https://github.com/coinbase/rest-hooks/issues/392)) ([899563d](https://github.com/coinbase/rest-hooks/commit/899563deccaccc214c3504b91b96e1460ddfab2f))
* Support extra endpoint members and inheritance ([#387](https://github.com/coinbase/rest-hooks/issues/387)) ([6ad5486](https://github.com/coinbase/rest-hooks/commit/6ad5486b6e333d8721b74fd4fb1b7ed783461435))
* Support helper methods ([c3fb075](https://github.com/coinbase/rest-hooks/commit/c3fb075b390e7c8db28d53962563b92b65d7869d))


### 💅 Enhancement

* `endpoint` package only exports definitions ([#473](https://github.com/coinbase/rest-hooks/issues/473)) ([51dcafe](https://github.com/coinbase/rest-hooks/commit/51dcafe98631998a1db1959f2796d7122d96960b))
* EndpointInstance defaults should match everything ([d7067ba](https://github.com/coinbase/rest-hooks/commit/d7067baf68e03c0b389c4349fee18571e9172062))
* Improve endpoint ([#364](https://github.com/coinbase/rest-hooks/issues/364)) ([503dd29](https://github.com/coinbase/rest-hooks/commit/503dd29f7cb89ecf1659d065932eae33f0855e1d))
* Make Endpoint compatible with FetchShape ([caa967c](https://github.com/coinbase/rest-hooks/commit/caa967ceaa0c1288b15711b0c18b132689b94cc1))
* Resource uses endpoint ([#365](https://github.com/coinbase/rest-hooks/issues/365)) ([4472106](https://github.com/coinbase/rest-hooks/commit/4472106afd05ad060399f0cd3a872ed07e3350ec))


### 🐛 Bug Fix

* Ambient files now typechecked, fixed some types there ([#372](https://github.com/coinbase/rest-hooks/issues/372)) ([223d4a4](https://github.com/coinbase/rest-hooks/commit/223d4a478ae4b6ba7d42f9d1c2b9deca5b228c8d))
* Compile types for endpoint ([a1b4195](https://github.com/coinbase/rest-hooks/commit/a1b4195083420356779deada24290b77092a45d0))
* Export Endpoint through core ([8b60dea](https://github.com/coinbase/rest-hooks/commit/8b60dea6c85518bbd32b088440e591614d3a11f0))
* Export type correctly in endpoint ([#401](https://github.com/coinbase/rest-hooks/issues/401)) ([f2b033a](https://github.com/coinbase/rest-hooks/commit/f2b033a7f7fd6614ad0d7a25093948f26c495db4))
* extend() correctly keeps options for FetchShape compat ([bf522a2](https://github.com/coinbase/rest-hooks/commit/bf522a2d138dc6bc700e9e5b7f9c9bc1dfd9e148))
* Infer useFetcher() has no body when not present in fetch ([#385](https://github.com/coinbase/rest-hooks/issues/385)) ([22dd399](https://github.com/coinbase/rest-hooks/commit/22dd3995c519e1990f2388b6365494cec873d04a))
* Only export AbstractInstanceType in type-world ([#396](https://github.com/coinbase/rest-hooks/issues/396)) ([131fa45](https://github.com/coinbase/rest-hooks/commit/131fa45063be8fe3dc861dc3639d38dc430580dc))
* Publish endpoint ambient typescript declarations ([2e982ca](https://github.com/coinbase/rest-hooks/commit/2e982caf484da6f2970506b803d4eb52ce0c558d))
* Remove broken type ([09e8268](https://github.com/coinbase/rest-hooks/commit/09e826841efc9d3cf1b6432ca2977fb0f8f558bd))
* Remove broken type ([316e5a0](https://github.com/coinbase/rest-hooks/commit/316e5a0945d79ad82748a0e100d3a4a5c788e44c))


### 📦 Package

* Use @babel/runtime @ 7.12 ([e631f6a](https://github.com/coinbase/rest-hooks/commit/e631f6a8c435c5ef74b3809c8950a2caceca8763))


### 📝 Documentation

* Add Endpoint to API section ([73428b0](https://github.com/coinbase/rest-hooks/commit/73428b01a5759c8079ca3b0de5aa51e77f2e2dde))
* Add more to readme ([2fc29e5](https://github.com/coinbase/rest-hooks/commit/2fc29e5f94512a1fa9fb4b2777679a7499e360da))
* Fix tags ([987f0ed](https://github.com/coinbase/rest-hooks/commit/987f0ed7d4980c3276bb8c9701f606364dad93d8))



## [0.8.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/endpoint@0.7.4...@rest-hooks/endpoint@0.8.0) (2021-01-19)


### ⚠ 💥 BREAKING CHANGES

* Remove `normalize`, `denormalize`; use
`normalizr` package for those

### 💅 Enhancement

* `endpoint` package only exports definitions ([#473](https://github.com/coinbase/rest-hooks/issues/473)) ([51dcafe](https://github.com/coinbase/rest-hooks/commit/51dcafe98631998a1db1959f2796d7122d96960b))



## <small>0.7.4 (2021-01-14)</small>

**Note:** Version bump only for package @rest-hooks/endpoint





## <small>0.7.3 (2021-01-06)</small>

* pkg: Use @babel/runtime @ 7.12 ([e631f6a](https://github.com/coinbase/rest-hooks/commit/e631f6a))





## <small>0.7.2 (2020-09-08)</small>

* internal: Upgrade build pkgs (#404) ([dc56530](https://github.com/coinbase/rest-hooks/commit/dc56530)), closes [#404](https://github.com/coinbase/rest-hooks/issues/404)
* enhance: EndpointInstance defaults should match everything ([d7067ba](https://github.com/coinbase/rest-hooks/commit/d7067ba))





## <small>0.7.1 (2020-08-13)</small>

* fix: Export type correctly in endpoint (#401) ([f2b033a](https://github.com/coinbase/rest-hooks/commit/f2b033a)), closes [#401](https://github.com/coinbase/rest-hooks/issues/401)





## 0.7.0 (2020-08-12)

* fix: Only export AbstractInstanceType in type-world (#396) ([131fa45](https://github.com/coinbase/rest-hooks/commit/131fa45)), closes [#396](https://github.com/coinbase/rest-hooks/issues/396)
* feat: Simple AbortController integration (#392) ([899563d](https://github.com/coinbase/rest-hooks/commit/899563d)), closes [#392](https://github.com/coinbase/rest-hooks/issues/392)





## <small>0.6.1 (2020-08-09)</small>

* fix: extend() correctly keeps options for FetchShape compat ([bf522a2](https://github.com/coinbase/rest-hooks/commit/bf522a2))





## 0.6.0 (2020-08-08)

* internal: Test using endpoints directly (#389) ([bb0e8fd](https://github.com/coinbase/rest-hooks/commit/bb0e8fd)), closes [#389](https://github.com/coinbase/rest-hooks/issues/389)
* feat: Support extra endpoint members and inheritance (#387) ([6ad5486](https://github.com/coinbase/rest-hooks/commit/6ad5486)), closes [#387](https://github.com/coinbase/rest-hooks/issues/387)





## <small>0.5.3 (2020-08-04)</small>

* fix: Infer useFetcher() has no body when not present in fetch (#385) ([22dd399](https://github.com/coinbase/rest-hooks/commit/22dd399)), closes [#385](https://github.com/coinbase/rest-hooks/issues/385)





## <small>0.5.2 (2020-07-31)</small>

**Note:** Version bump only for package @rest-hooks/endpoint





## <small>0.5.1 (2020-07-27)</small>

**Note:** Version bump only for package @rest-hooks/endpoint





## 0.5.0 (2020-07-27)

* feat: Add @rest-hooks/rest package (#375) ([5e5c125](https://github.com/coinbase/rest-hooks/commit/5e5c125)), closes [#375](https://github.com/coinbase/rest-hooks/issues/375)
* feat: Support helper methods ([c3fb075](https://github.com/coinbase/rest-hooks/commit/c3fb075))





## <small>0.4.3 (2020-07-22)</small>

* fix: Ambient files now typechecked, fixed some types there (#372) ([223d4a4](https://github.com/coinbase/rest-hooks/commit/223d4a4)), closes [#372](https://github.com/coinbase/rest-hooks/issues/372)





## <small>0.4.2 (2020-07-22)</small>

* fix: Remove broken type ([09e8268](https://github.com/coinbase/rest-hooks/commit/09e8268))
* fix: Remove broken type ([316e5a0](https://github.com/coinbase/rest-hooks/commit/316e5a0))





## <small>0.4.1 (2020-07-20)</small>

* fix: Export Endpoint through core ([8b60dea](https://github.com/coinbase/rest-hooks/commit/8b60dea))





## 0.4.0 (2020-07-14)

* enhance: Resource uses endpoint (#365) ([4472106](https://github.com/coinbase/rest-hooks/commit/4472106)), closes [#365](https://github.com/coinbase/rest-hooks/issues/365)


### BREAKING CHANGE

* getFetchOptions() -> getEndpointExtra()




## <small>0.3.2 (2020-07-14)</small>

* fix: Publish endpoint ambient typescript declarations ([2e982ca](https://github.com/coinbase/rest-hooks/commit/2e982ca))





## <small>0.3.1 (2020-07-13)</small>

* docs: Add Endpoint to API section ([73428b0](https://github.com/coinbase/rest-hooks/commit/73428b0))
* enhance: Improve endpoint (#364) ([503dd29](https://github.com/coinbase/rest-hooks/commit/503dd29)), closes [#364](https://github.com/coinbase/rest-hooks/issues/364)
* enhance: Make Endpoint compatible with FetchShape ([caa967c](https://github.com/coinbase/rest-hooks/commit/caa967c))





## 0.3.0 (2020-07-13)

* feat: Infer return type from schema ([2dccff4](https://github.com/coinbase/rest-hooks/commit/2dccff4))
* docs: Add more to readme ([2fc29e5](https://github.com/coinbase/rest-hooks/commit/2fc29e5))
* docs: Fix tags ([987f0ed](https://github.com/coinbase/rest-hooks/commit/987f0ed))





## 0.2.0 (2020-07-12)

* fix: Compile types for endpoint ([a1b4195](https://github.com/coinbase/rest-hooks/commit/a1b4195))
* internal: Move readme to top level endpoint folder ([36f6194](https://github.com/coinbase/rest-hooks/commit/36f6194))
* feat: Add @rest-hooks/endpoint package (#359) ([642bb1a](https://github.com/coinbase/rest-hooks/commit/642bb1a)), closes [#359](https://github.com/coinbase/rest-hooks/issues/359)
