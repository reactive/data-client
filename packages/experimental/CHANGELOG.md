# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.1.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@3.0.0...@rest-hooks/experimental@3.1.0) (2021-10-18)


### 🚀 Features

* useSubscription, useCache, useError ([#1402](https://github.com/coinbase/rest-hooks/issues/1402)) ([da82acd](https://github.com/coinbase/rest-hooks/commit/da82acdbd9f811932ff68d42ff472721f91fe457))


### 🐛 Bug Fix

* Import ExpiryStatus correctly ([#1399](https://github.com/coinbase/rest-hooks/issues/1399)) ([3453764](https://github.com/coinbase/rest-hooks/commit/345376443c11f77a9c24a6d1c324518d6d524c27))



## [3.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@2.0.0...@rest-hooks/experimental@3.0.0) (2021-10-17)


### ⚠ 💥 BREAKING CHANGES

* Require @rest-hooks/core@3

### 🚀 Features

* Add useSuspense() ([#1397](https://github.com/coinbase/rest-hooks/issues/1397)) ([a43e695](https://github.com/coinbase/rest-hooks/commit/a43e695e331fbec2f9b7b7c576f9b2ed23d001c9))


### 📝 Documentation

* Only validate circleCI badge against master ([#1322](https://github.com/coinbase/rest-hooks/issues/1322)) ([04e9642](https://github.com/coinbase/rest-hooks/commit/04e96426a865cbef362947da3a8f74f7347859e9))



## [2.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.1...@rest-hooks/experimental@2.0.0) (2021-09-19)


### ⚠ 💥 BREAKING CHANGES

* Requires @rest-hooks/core>=2.1
Throttle is inferred from Endpoint.sideEffect

### 💅 Enhancement

* Use @rest-hooks/core controller ([#1249](https://github.com/coinbase/rest-hooks/issues/1249)) ([3cd40f1](https://github.com/coinbase/rest-hooks/commit/3cd40f179f91c08d5720cb0337e11c58263abf38))



### [1.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.0...@rest-hooks/experimental@1.0.1) (2021-09-14)


### 💅 Enhancement

* Improve list().paginated() types ([#1237](https://github.com/coinbase/rest-hooks/issues/1237)) ([94acf71](https://github.com/coinbase/rest-hooks/commit/94acf71fb735958473cfd8d4089176888c085f82))
* Maintain order during pagination ([#1232](https://github.com/coinbase/rest-hooks/issues/1232)) ([b9b0973](https://github.com/coinbase/rest-hooks/commit/b9b0973a87dabb43b8e2cf50c92b3034c2086453))



## [1.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.0-beta.4...@rest-hooks/experimental@1.0.0) (2021-09-08)

**Note:** Version bump only for package @rest-hooks/experimental





## [1.0.0-beta.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.0-beta.3...@rest-hooks/experimental@1.0.0-beta.4) (2021-09-06)


### ⚠ 💥 BREAKING CHANGES

* useController(true) -> useController({ throttle: true
})

### 💅 Enhancement

* Give errors a name ([#1195](https://github.com/coinbase/rest-hooks/issues/1195)) ([caa1cd4](https://github.com/coinbase/rest-hooks/commit/caa1cd4c365eedc0e6bc8df6b00b9bfdf6492c63))
* Improve NetworkError debuggability ([#1172](https://github.com/coinbase/rest-hooks/issues/1172)) ([9fb64bb](https://github.com/coinbase/rest-hooks/commit/9fb64bbf31827c65eaa1e6b0617e46f685d9ea58))


### 📝 Documentation

* Minor typos ([#1188](https://github.com/coinbase/rest-hooks/issues/1188)) ([9fe6c0d](https://github.com/coinbase/rest-hooks/commit/9fe6c0d82f9b6f5922a8f2977609e0ff6e7c9551))
* Some fixups for the usecontroller blog ([#1182](https://github.com/coinbase/rest-hooks/issues/1182)) ([9179c2e](https://github.com/coinbase/rest-hooks/commit/9179c2e8d867c84d92ca28475c82f77c8be356b3))


* useController() takes configuration options (#1179) ([4847848](https://github.com/coinbase/rest-hooks/commit/4847848a2778b54488e66dd265e076d9fb140161)), closes [#1179](https://github.com/coinbase/rest-hooks/issues/1179)



## [1.0.0-beta.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.0-beta.2...@rest-hooks/experimental@1.0.0-beta.3) (2021-08-22)


### 💅 Enhancement

* Resource.delete() handles empty object response ([#1131](https://github.com/coinbase/rest-hooks/issues/1131)) ([450127a](https://github.com/coinbase/rest-hooks/commit/450127a256d9e2d4fa20b7bd38768681c5f5412e))


### 🐛 Bug Fix

* Cannot update a component while rendering a different component ([#1130](https://github.com/coinbase/rest-hooks/issues/1130)) ([0003388](https://github.com/coinbase/rest-hooks/commit/00033882ec88338b94bd78c8a7a5ad2954af40d6))



## [1.0.0-beta.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.0-beta.1...@rest-hooks/experimental@1.0.0-beta.2) (2021-08-21)


### 🚀 Features

* useController() ([#1048](https://github.com/coinbase/rest-hooks/issues/1048)) ([a485782](https://github.com/coinbase/rest-hooks/commit/a4857820ee37f2be467ab85b477f083f7f3f737c))


### 💅 Enhancement

* Experimental fetcher resolves before react render ([#1046](https://github.com/coinbase/rest-hooks/issues/1046)) ([1ec90e5](https://github.com/coinbase/rest-hooks/commit/1ec90e5bb8d69bb47a4099a137c0935cd001c4fb))


### 🐛 Bug Fix

* RESET clears inflight fetches ([#1085](https://github.com/coinbase/rest-hooks/issues/1085)) ([02fa0d5](https://github.com/coinbase/rest-hooks/commit/02fa0d527ef138961ba6dc2509648337c01e604d))
* useFetchInit() hook calls same amount every render ([#1123](https://github.com/coinbase/rest-hooks/issues/1123)) ([6cd0b7c](https://github.com/coinbase/rest-hooks/commit/6cd0b7cc57de59b5f394942dfa9a3a08d9f2e912))



## [1.0.0-beta.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@1.0.0-beta.0...@rest-hooks/experimental@1.0.0-beta.1) (2021-07-15)


### 🚀 Features

* FixtureEndpoint & renderRestHook resolverFixtures ([#1027](https://github.com/coinbase/rest-hooks/issues/1027)) ([bbb69e9](https://github.com/coinbase/rest-hooks/commit/bbb69e9faaa523c46a0e309a44e0fd52f0ce91aa))
* Mark compatibility with upcoming versions ([#959](https://github.com/coinbase/rest-hooks/issues/959)) ([72da158](https://github.com/coinbase/rest-hooks/commit/72da158c19acf4c76b8b86eb37e063956b7347fd))


### 🐛 Bug Fix

* Don't inline normalizr into cjs ([#1038](https://github.com/coinbase/rest-hooks/issues/1038)) ([f7c0822](https://github.com/coinbase/rest-hooks/commit/f7c08225180aa2284294982482105c119383df6d))



## [1.0.0-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.8.0...@rest-hooks/experimental@1.0.0-beta.0) (2021-06-30)


### ⚠ 💥 BREAKING CHANGES

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
* Mark compatibility with upcoming versions ([#959](https://github.com/coinbase/rest-hooks/issues/959)) ([a30fe4c](https://github.com/coinbase/rest-hooks/commit/a30fe4c000878aafe724915f653594aa67c5c336))


### 💅 Enhancement

* Entities normalize to POJO ([#940](https://github.com/coinbase/rest-hooks/issues/940)) ([75ebdfe](https://github.com/coinbase/rest-hooks/commit/75ebdfe641ccf57fca35c44a94077e4a314e44d7))


### 📝 Documentation

* Add doc links to jsdocs ([#966](https://github.com/coinbase/rest-hooks/issues/966)) ([dc7fcfe](https://github.com/coinbase/rest-hooks/commit/dc7fcfec24c30d5f405d24ccc1828620d837ea6b))


## [0.9.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.8.0...@rest-hooks/experimental@0.9.0) (2021-06-25)


### 🚀 Features

* Mark compatibility with upcoming versions ([#959](https://github.com/coinbase/rest-hooks/issues/959)) ([72da158](https://github.com/coinbase/rest-hooks/commit/72da158c19acf4c76b8b86eb37e063956b7347fd))



## [0.8.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.7.0...@rest-hooks/experimental@0.8.0) (2021-06-19)


### 🚀 Features

* Add Entity.validate() ([#934](https://github.com/coinbase/rest-hooks/issues/934)) ([b236b91](https://github.com/coinbase/rest-hooks/commit/b236b9137043d12de5a07bfd5583b5cb2d15f6cd))


### 💅 Enhancement

* More flexible fetch types to help with inheritance ([#932](https://github.com/coinbase/rest-hooks/issues/932)) ([3ff23cf](https://github.com/coinbase/rest-hooks/commit/3ff23cfbe67be4ce2bf314418bb865b05b94c352))



## [0.7.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.6.0...@rest-hooks/experimental@0.7.0) (2021-06-16)


### 🚀 Features

* Add Entity.expiresAt() - entity TTL configuration  ([#920](https://github.com/coinbase/rest-hooks/issues/920)) ([e0919c2](https://github.com/coinbase/rest-hooks/commit/e0919c2aa523e0a2fc8c6935dcf38953d723527e))
* Support deletes with responses ([#919](https://github.com/coinbase/rest-hooks/issues/919)) ([a8129cd](https://github.com/coinbase/rest-hooks/commit/a8129cd432a39d26fd7bb0ad7a9cec5094665ee5))



## [0.6.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.5.0...@rest-hooks/experimental@0.6.0) (2021-06-13)


### 🚀 Features

* Endpoint.name ([#914](https://github.com/coinbase/rest-hooks/issues/914)) ([aa5f80d](https://github.com/coinbase/rest-hooks/commit/aa5f80db6c47ff975b1d257352315a57b87addce))
* Normalize merges entities, entitymeta, indexes ([#915](https://github.com/coinbase/rest-hooks/issues/915)) ([bd21d8c](https://github.com/coinbase/rest-hooks/commit/bd21d8ce0d004a56e6853918d9fb9ecaa2c730a8))
* Support React 18 ([#907](https://github.com/coinbase/rest-hooks/issues/907)) ([63e8bc9](https://github.com/coinbase/rest-hooks/commit/63e8bc9887a080e1aa510d972645c037dfc96128))



## [0.5.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.4.0...@rest-hooks/experimental@0.5.0) (2021-06-09)


### 🚀 Features

* Add inferResults() ([#900](https://github.com/coinbase/rest-hooks/issues/900)) ([5ad8287](https://github.com/coinbase/rest-hooks/commit/5ad8287fefd50637670c07252b01ea63ea05333a))


### 💅 Enhancement

* 'module' entrypoint targets 2019 browsers ([#905](https://github.com/coinbase/rest-hooks/issues/905)) ([d988abe](https://github.com/coinbase/rest-hooks/commit/d988abe063fc67c74fce12e234c9c3ffdb7cc230))



## [0.4.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.2.1...@rest-hooks/experimental@0.4.0) (2021-06-02)


### 🚀 Features

* Export types for Resource ([#889](https://github.com/coinbase/rest-hooks/issues/889)) ([c2766ae](https://github.com/coinbase/rest-hooks/commit/c2766aefa2f1bd736d635c9b5bd51170d9fe104c))
* Resource.list().paginate() ([#868](https://github.com/coinbase/rest-hooks/issues/868)) ([cecdd7d](https://github.com/coinbase/rest-hooks/commit/cecdd7dd0fc5d4bbffd7f7cf7fa1344be3807697))


### 💅 Enhancement

* Cache entity default instances ([#883](https://github.com/coinbase/rest-hooks/issues/883)) ([842f6c8](https://github.com/coinbase/rest-hooks/commit/842f6c8e3dfc27e2946f5adc1bdbef849e8794ab))
* Improve autoimport handling in vscode ([#890](https://github.com/coinbase/rest-hooks/issues/890)) ([f8f2bef](https://github.com/coinbase/rest-hooks/commit/f8f2bef411183676009c6a9df24a26d147c6d9f6))


### 📝 Documentation

* Add paginated() to readme ([#891](https://github.com/coinbase/rest-hooks/issues/891)) ([44b85ed](https://github.com/coinbase/rest-hooks/commit/44b85edc6d3a4273a46a8e0f771ca281af25e254))



## [0.3.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.2.1...@rest-hooks/experimental@0.3.0) (2021-05-30)


### 🚀 Features

* Resource.list().paginate() ([#868](https://github.com/coinbase/rest-hooks/issues/868)) ([cecdd7d](https://github.com/coinbase/rest-hooks/commit/cecdd7dd0fc5d4bbffd7f7cf7fa1344be3807697))



### [0.2.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/experimental@0.2.0...@rest-hooks/experimental@0.2.1) (2021-05-24)


### 💅 Enhancement

* Provide args to update method ([#852](https://github.com/coinbase/rest-hooks/issues/852)) ([a552977](https://github.com/coinbase/rest-hooks/commit/a552977752c0f89852e0814cebd3956f0e1338bd))


### 🐛 Bug Fix

* Correct peerDeps ([#855](https://github.com/coinbase/rest-hooks/issues/855)) ([07e3f6f](https://github.com/coinbase/rest-hooks/commit/07e3f6f8942efe5dcc72dcaa8df5feed06ea4aab))


### 📝 Documentation

* Add instructions for experimental pieces ([#845](https://github.com/coinbase/rest-hooks/issues/845)) ([6e8c0ee](https://github.com/coinbase/rest-hooks/commit/6e8c0ee6c7ff5257f8159633bb94ff945f24198d))



## 0.2.0 (2021-05-24)


### 🚀 Features

* @rest-hooks/experimental ([#781](https://github.com/coinbase/rest-hooks/issues/781)) ([7acb438](https://github.com/coinbase/rest-hooks/commit/7acb438f648c57bf47709399f5fafc2a1cee88fe))
* Add Resource that extneds from new Entity ([#841](https://github.com/coinbase/rest-hooks/issues/841)) ([e0ef23d](https://github.com/coinbase/rest-hooks/commit/e0ef23dcc9359c1c9c3aafc7ffb03a0dba961168))
* Endpoint.update programmable sideeffects ([#843](https://github.com/coinbase/rest-hooks/issues/843)) ([3b011b2](https://github.com/coinbase/rest-hooks/commit/3b011b2ab7d3f2fd6588bd26c566bf542beeba49))
* New Entity that normalizes to pojos ([#821](https://github.com/coinbase/rest-hooks/issues/821)) ([de401a6](https://github.com/coinbase/rest-hooks/commit/de401a6cbb82a5cb4b9f911a464bb081c319de29))
