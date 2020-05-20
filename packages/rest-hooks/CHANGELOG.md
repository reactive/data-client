# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.0-beta.16](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.15...rest-hooks@5.0.0-beta.16) (2020-05-20)

**Note:** Version bump only for package rest-hooks





## [5.0.0-beta.15](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.14...rest-hooks@5.0.0-beta.15) (2020-05-19)

**Note:** Version bump only for package rest-hooks





## [5.0.0-beta.14](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.13...rest-hooks@5.0.0-beta.14) (2020-05-19)

**Note:** Version bump only for package rest-hooks





## [5.0.0-beta.13](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.12...rest-hooks@5.0.0-beta.13) (2020-05-19)

**Note:** Version bump only for package rest-hooks





## [5.0.0-beta.12](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.11...rest-hooks@5.0.0-beta.12) (2020-05-14)


### 🏠 Internal

* Test rest-hooks specific CacheProvider ([724f780](https://github.com/coinbase/rest-hooks/commit/724f7805ece06d69e3f7150f7ce347d3cb8d0f04))


### 📝 Documentation

* Get rid of all references to asSchema() ([#339](https://github.com/coinbase/rest-hooks/issues/339)) ([01b878b](https://github.com/coinbase/rest-hooks/commit/01b878b85f7469a12e19912efc696a424663e5f5))



## [5.0.0-beta.11](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.10...rest-hooks@5.0.0-beta.11) (2020-05-13)


### 🐛 Bug Fix

* CacheProvider in rest-hooks no longer infinitely recurses ([d2ded89](https://github.com/coinbase/rest-hooks/commit/d2ded895a09e7bd7d52054b6265f1c3e8c2de783))



## [5.0.0-beta.10](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.9...rest-hooks@5.0.0-beta.10) (2020-05-13)


### 🐛 Bug Fix

* Export correct CacheManager with PolingManager as default ([a6a99a0](https://github.com/coinbase/rest-hooks/commit/a6a99a07a2afe300f3b8a2b9c00735688bdb3b72))



## [5.0.0-beta.9](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.8...rest-hooks@5.0.0-beta.9) (2020-05-13)


### 💅 Enhancement

* Add back remaining normalizr exports to rest-hooks ([b6878ee](https://github.com/coinbase/rest-hooks/commit/b6878eebbf1572a4b859828da81a058bc5c118e3))



## [5.0.0-beta.8](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.7...rest-hooks@5.0.0-beta.8) (2020-05-13)

**Note:** Version bump only for package rest-hooks





## [5.0.0-beta.7](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.6...rest-hooks@5.0.0-beta.7) (2020-05-12)


### 💅 Enhancement

* New package @rest-hooks/core ([#336](https://github.com/coinbase/rest-hooks/issues/336)) ([bf490c0](https://github.com/coinbase/rest-hooks/commit/bf490c030feb8a0e35e96c6dd7d180e45ac8bfd0))
* No longer require 'asSchema()' ([#335](https://github.com/coinbase/rest-hooks/issues/335)) ([a29c41b](https://github.com/coinbase/rest-hooks/commit/a29c41b4449741e0e589d513261186e1a1cbe98a))



## [5.0.0-beta.6](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.5...rest-hooks@5.0.0-beta.6) (2020-05-08)


### 💅 Enhancement

* Detect more cases of network mismatching schema ([#331](https://github.com/coinbase/rest-hooks/issues/331)) ([2af464f](https://github.com/coinbase/rest-hooks/commit/2af464f54318c5f099899150371c911133a717cb))


### 🏠 Internal

* Improve test coverage ([#330](https://github.com/coinbase/rest-hooks/issues/330)) ([edc5f73](https://github.com/coinbase/rest-hooks/commit/edc5f73471fc2b68a95b4ef09d883e7dab016d7d))



## [5.0.0-beta.5](https://github.com/coinbase/rest-hooks/compare/rest-hooks@5.0.0-beta.1...rest-hooks@5.0.0-beta.5) (2020-05-04)


### 🏠 Internal

* Fix package versions for publish ([06d69ca](https://github.com/coinbase/rest-hooks/commit/06d69ca6d8e8d4dbf847f8a1593bfa65af8d79c6))



## [5.0.0-beta.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.9...rest-hooks@5.0.0-beta.0) (2020-04-26)


### ⚠ 💥 BREAKING CHANGES

* Added promise to FetchAction['meta']
* When invalidIfStale is true, useCache() and
useStatefulResource() will no longer return entities, even if they
are in the cache

### 🚀 Features

* Add ConnectionListener and a default browser implementation ([#305](https://github.com/coinbase/rest-hooks/issues/305)) ([f63f66c](https://github.com/coinbase/rest-hooks/commit/f63f66c9499dd363574fbcd832fc94e7663b12e4))
* Add createFetch() action creator ([#320](https://github.com/coinbase/rest-hooks/issues/320)) ([392ea15](https://github.com/coinbase/rest-hooks/commit/392ea151ec1a08dbf47480f19c149e869e28939e))
* Simplified Entity class ([#315](https://github.com/coinbase/rest-hooks/issues/315)) ([0e6bfcb](https://github.com/coinbase/rest-hooks/commit/0e6bfcb3620006e285510d4e5121fce743214d55))


### 💅 Enhancement

* Add optional generic for fetch return value in shape types ([#311](https://github.com/coinbase/rest-hooks/issues/311)) ([280fa3d](https://github.com/coinbase/rest-hooks/commit/280fa3d19935e7f0b16b84c6532a71d64bc45da5))
* Infer returntype of useFetcher()'s functions ([#310](https://github.com/coinbase/rest-hooks/issues/310)) ([bb75c15](https://github.com/coinbase/rest-hooks/commit/bb75c15391c85d77e3a70abdd7c55e20eca1eb49))
* Make SimpleRecord's unique identifier keyed by symbol ([6f0781b](https://github.com/coinbase/rest-hooks/commit/6f0781b867f7e55d3d59b78b32e420e24a4ac844))
* Make useResource() param type errors more readable ([2de35ce](https://github.com/coinbase/rest-hooks/commit/2de35ce41bfd780b8f8ca3aaba9e4ebc03c79447))
* Schemas with no entities should not infer ([#323](https://github.com/coinbase/rest-hooks/issues/323)) ([79f048d](https://github.com/coinbase/rest-hooks/commit/79f048df72730f61ac905fe19b1074600ce1d8ee))
* Simplify NM existance check in dev mode ([47afd8d](https://github.com/coinbase/rest-hooks/commit/47afd8d47cd4864afc228f3b4b345a3666906f86))
* Simplify online/offline polling logic ([#308](https://github.com/coinbase/rest-hooks/issues/308)) ([3be8e9d](https://github.com/coinbase/rest-hooks/commit/3be8e9d0664d2f72f5fce1b4ba425c82e8ed229a))
* useCache() and useStatefulResource() respect invalidIfStale ([#307](https://github.com/coinbase/rest-hooks/issues/307)) ([58f2c40](https://github.com/coinbase/rest-hooks/commit/58f2c40a66fb0d0c1f900840160e17ce87beace2))
* useResource array parameters as readonly ([#319](https://github.com/coinbase/rest-hooks/issues/319)) ([fb1b39f](https://github.com/coinbase/rest-hooks/commit/fb1b39f54e2cfad062ba33eca8f7ffd15de7fe9d))


### 🐛 Bug Fix

* Connection listener feature detection ([5b360df](https://github.com/coinbase/rest-hooks/commit/5b360df5f23a0ce36f3638198ddb4938717401b4))
* Inferred results are considered stale ([fc4ee61](https://github.com/coinbase/rest-hooks/commit/fc4ee61bb692f98f053b14e0aff20d5e76c8c131))
* Inferring with union types ([5ab6159](https://github.com/coinbase/rest-hooks/commit/5ab6159a1887a216564ac15f84774c9b7b9e76bf))


### 📦 Package

* Bump internal pkgs ([#306](https://github.com/coinbase/rest-hooks/issues/306)) ([46bebad](https://github.com/coinbase/rest-hooks/commit/46bebad79d848404d02423fd2a3e2d647ee5bbbb))


### 🏠 Internal

* Hoist coveralls to root, since testing is done there ([3b1dbaa](https://github.com/coinbase/rest-hooks/commit/3b1dbaac303048a1b1e543f99fb9758b21feb083))
* Update prettier, format files ([88d5627](https://github.com/coinbase/rest-hooks/commit/88d5627fb1963842d2a644cfe06f0780cb3c2dde))



### [4.5.9](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.8...rest-hooks@4.5.9) (2020-03-22)


### 🐛 Bug Fix

* Do not run reducer on non-optimistic fetches ([#302](https://github.com/coinbase/rest-hooks/issues/302)) ([86cc80b](https://github.com/coinbase/rest-hooks/commit/86cc80bdef15ba1e8c0ebe011989405c334e458b))


### 🏠 Internal

* Update eslint-plugin + prettier 2 ([#304](https://github.com/coinbase/rest-hooks/issues/304)) ([210eabc](https://github.com/coinbase/rest-hooks/commit/210eabcec4651f3150658535df6dce730bf7665e))



### [4.5.8](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.7...rest-hooks@4.5.8) (2020-03-13)


### 💅 Enhancement

* Be more descriptive for not implemented ([#292](https://github.com/coinbase/rest-hooks/issues/292)) ([bb55212](https://github.com/coinbase/rest-hooks/commit/bb55212c206831acb2a669c5fba826e2fd0e96ca))


### 🐛 Bug Fix

* 0 for expiryLength should not result in default ([#296](https://github.com/coinbase/rest-hooks/issues/296)) ([c75dca5](https://github.com/coinbase/rest-hooks/commit/c75dca5fce8a07dcec5bbb942bddcb31625c757f))
* Don't crash polling subscriptions on react native ([f57cd41](https://github.com/coinbase/rest-hooks/commit/f57cd41210547f3e3c8c57a32c2ba35311992fac))



### [4.5.7](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.6...rest-hooks@4.5.7) (2020-03-12)


### 🐛 Bug Fix

* Don't throw when RN tries to poll ([#291](https://github.com/coinbase/rest-hooks/issues/291)) ([6a57af9](https://github.com/coinbase/rest-hooks/commit/6a57af9107fbd15eeac16365335f0d75825cc6bc))



### [4.5.6](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.5...rest-hooks@4.5.6) (2020-03-11)


### 🐛 Bug Fix

* Index updates should possibly rerender ([#289](https://github.com/coinbase/rest-hooks/issues/289)) ([ad2927e](https://github.com/coinbase/rest-hooks/commit/ad2927eb30311f09b0b03abfd6a8364bc9ea2301))



### [4.5.5](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.4...rest-hooks@4.5.5) (2020-03-08)


### 🏠 Internal

* Only allow building types from root ([0c3d7ae](https://github.com/coinbase/rest-hooks/commit/0c3d7ae1a9d6130848f31850ed8b15e6ed01d0ab))



### [4.5.4](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.3...rest-hooks@4.5.4) (2020-03-03)


### 🐛 Bug Fix

* Add generic useResource parallel overloads for up to 16 arguments ([#281](https://github.com/coinbase/rest-hooks/issues/281)) ([da1578e](https://github.com/coinbase/rest-hooks/commit/da1578eeae6ee3b38b2a3406685032907cdaee16))



### [4.5.3](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.2...rest-hooks@4.5.3) (2020-03-01)


### 🐛 Bug Fix

* useCache() with indexes but no entities ever stored ([#279](https://github.com/coinbase/rest-hooks/issues/279)) ([67a1257](https://github.com/coinbase/rest-hooks/commit/67a12577620a3b2e8cec7498c0d654b210d2cce1))



### [4.5.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.1...rest-hooks@4.5.2) (2020-02-26)


### 🐛 Bug Fix

* type SimpleRecord._unq should be private ([#274](https://github.com/coinbase/rest-hooks/issues/274)) ([e6ad2c1](https://github.com/coinbase/rest-hooks/commit/e6ad2c1c50d16b23e6b067b936a70f6672e8ce1c))


### 📦 Package

* Upgrade to TypeScript 3.8 ([#272](https://github.com/coinbase/rest-hooks/issues/272)) ([d9086b6](https://github.com/coinbase/rest-hooks/commit/d9086b6f0e7033a51e1ea5bd3850c4135d7a9b58))


### 🏠 Internal

* readonly should exist on all levels of internal state ([#276](https://github.com/coinbase/rest-hooks/issues/276)) ([a884186](https://github.com/coinbase/rest-hooks/commit/a884186e2696b40ab764979d646089aa625dfe8d))
* Use Record<string, any> form for POJOs ([dae11b2](https://github.com/coinbase/rest-hooks/commit/dae11b233d4cc3d56ba93f1488a0b42ba7a1dfce))



### [4.5.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.0...rest-hooks@4.5.1) (2020-02-19)


### 🐛 Bug Fix

* Fix commonjs bundle ([#271](https://github.com/coinbase/rest-hooks/issues/271)) ([a898bd0](https://github.com/coinbase/rest-hooks/commit/a898bd0c3497711a25c584f78d1e9c0cbde29949))


### 🏠 Internal

* Check compressed size changes on PR ([#270](https://github.com/coinbase/rest-hooks/issues/270)) ([d70ccbf](https://github.com/coinbase/rest-hooks/commit/d70ccbf44ac5ba8fdc4f70886851ab18349f37e6))



## [4.5.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.0-beta.3...rest-hooks@4.5.0) (2020-02-18)

**Note:** Version bump only for package rest-hooks





## [4.5.0-beta.3](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.0-beta.2...rest-hooks@4.5.0-beta.3) (2020-02-18)


### 🏠 Internal

* Pull out new package @rest-hooks/use-enhanced-reducer ([#269](https://github.com/coinbase/rest-hooks/issues/269)) ([bb99aeb](https://github.com/coinbase/rest-hooks/commit/bb99aebf6133b34950b1ce3c422fb034fd2971ed))



## [4.5.0-beta.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.0-beta.1...rest-hooks@4.5.0-beta.2) (2020-02-18)


### 🐛 Bug Fix

* Poll fetches while testing should be wrapped in act ([#268](https://github.com/coinbase/rest-hooks/issues/268)) ([9c264bb](https://github.com/coinbase/rest-hooks/commit/9c264bb1e5a736b6bdab2077185cebd754c39b6f))


### 🏠 Internal

* Centralize jest config ([#230](https://github.com/coinbase/rest-hooks/issues/230)) ([5d769d2](https://github.com/coinbase/rest-hooks/commit/5d769d2485fe62ba65f4176894768bdbb6faafb3))



## [4.5.0-beta.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.5.0-beta.0...rest-hooks@4.5.0-beta.1) (2020-02-13)


### 🚀 Features

* Support non JSON (aka binary) fetches ([#267](https://github.com/coinbase/rest-hooks/issues/267)) ([fb8e6d8](https://github.com/coinbase/rest-hooks/commit/fb8e6d8821d78dba11b4cac20762b94682110148))



## [4.5.0-beta.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.4.0...rest-hooks@4.5.0-beta.0) (2020-02-13)


### 🚀 Features

* Include all FetchOptions in subscribe action ([#265](https://github.com/coinbase/rest-hooks/issues/265)) ([e27f420](https://github.com/coinbase/rest-hooks/commit/e27f420f9a562535d1c1784570be80c9606948cf))



## [4.4.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.4.0-beta.1...rest-hooks@4.4.0) (2020-02-10)


### 💅 Enhancement

* Commonjs bundle uses native-compatible code ([#263](https://github.com/coinbase/rest-hooks/issues/263)) ([5da9047](https://github.com/coinbase/rest-hooks/commit/5da9047aa1021b452732f6438fc49a8382f0dc77))



## [4.4.0-beta.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.4.0-beta.0...rest-hooks@4.4.0-beta.1) (2020-02-06)


### 🚀 Features

* Export EntitySchema and EntityInstance types ([edef484](https://github.com/coinbase/rest-hooks/commit/edef48457e1a0acebbcc099e5900468e606156f4))



## [4.4.0-beta.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.3.1...rest-hooks@4.4.0-beta.0) (2020-02-04)


### 🚀 Features

* Add SetShapeParams ([#259](https://github.com/coinbase/rest-hooks/issues/259)) ([0c1a78e](https://github.com/coinbase/rest-hooks/commit/0c1a78e971f72b6c4fb288c2afa428b20de40464))
* Export ParamsFromShape type ([df12329](https://github.com/coinbase/rest-hooks/commit/df1232995a0b2b62728a6b2e940e185d5d6ef8fd))


### 🐛 Bug Fix

* Export * for types ([3968d51](https://github.com/coinbase/rest-hooks/commit/3968d511647143c6934f14a4db4b906fe046123b))
* listUrl() on react native no longer throws error ([#262](https://github.com/coinbase/rest-hooks/issues/262)) ([aeae764](https://github.com/coinbase/rest-hooks/commit/aeae76475be0fe350f066e3869b2a4936513214e))


### 📝 Documentation

* Use bundlephobia badge for lib size ([eb76258](https://github.com/coinbase/rest-hooks/commit/eb76258db4be81a4a22ce01074c4a88cfc4ff0b8))



### [4.3.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.3.0...rest-hooks@4.3.1) (2020-01-29)

**Note:** Version bump only for package rest-hooks





## [4.3.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.3.0-beta.2...rest-hooks@4.3.0) (2020-01-29)


### 💅 Enhancement

* Use latest normalizr denormalize export ([4a55ce1](https://github.com/coinbase/rest-hooks/commit/4a55ce18816d7cf84a416217a0e51ae81c9fc7d0))



## [4.3.0-beta.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.3.0-beta.1...rest-hooks@4.3.0-beta.2) (2020-01-27)


### 💅 Enhancement

* Keep referential equality in list views ([#251](https://github.com/coinbase/rest-hooks/issues/251)) ([caf2bf7](https://github.com/coinbase/rest-hooks/commit/caf2bf78e6c48af8a32b080291ae60615ad05b34))
* Remove lodash dependency, reducing total bundle size ([#250](https://github.com/coinbase/rest-hooks/issues/250)) ([1e2bff1](https://github.com/coinbase/rest-hooks/commit/1e2bff1f2f3014903d1bc9302412930bbe62f927))



## [4.3.0-beta.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.3.0-beta.0...rest-hooks@4.3.0-beta.1) (2020-01-22)


### 💅 Enhancement

* NM only marks fetch processing in dev mode ([3bfec50](https://github.com/coinbase/rest-hooks/commit/3bfec50e9af7d1331dc78a01d5d360fb2a0fd3e5))


### 🐛 Bug Fix

* Optimistic updates now trigger for results with empty string ([#248](https://github.com/coinbase/rest-hooks/issues/248)) ([6ac25ac](https://github.com/coinbase/rest-hooks/commit/6ac25acfff37e91e9e00c3449f1c5ee83285d46e))



## [4.3.0-beta.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.2.4...rest-hooks@4.3.0-beta.0) (2020-01-19)


### 🚀 Features

* Add optimistic updates ([#246](https://github.com/coinbase/rest-hooks/issues/246)) ([d448c55](https://github.com/coinbase/rest-hooks/commit/d448c55aeb87aae40902db4c4d5ec4535c6f7167))


### 🏠 Internal

* Move action creation into own functions ([#245](https://github.com/coinbase/rest-hooks/issues/245)) ([46edd0a](https://github.com/coinbase/rest-hooks/commit/46edd0a38d083f6cc00b411424b5f5b1eb8158e4))



### [4.2.4](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.2.3...rest-hooks@4.2.4) (2020-01-18)


### 🐛 Bug Fix

* Entity export ([c4d3136](https://github.com/coinbase/rest-hooks/commit/c4d3136f47945960e4b7bdeab7bc108b33ecd268))



### [4.2.3](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.2.2...rest-hooks@4.2.3) (2020-01-18)

**Note:** Version bump only for package rest-hooks





### [4.2.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.2.1...rest-hooks@4.2.2) (2020-01-18)

**Note:** Version bump only for package rest-hooks





### [4.2.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.2.0...rest-hooks@4.2.1) (2020-01-17)


### 💅 Enhancement

* Add buildInferredResults and isEntity to __INTERNAL__ ([f88717b](https://github.com/coinbase/rest-hooks/commit/f88717b82b06f7226a6ca3044d47d311744a881d))



## [4.2.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.1.3...rest-hooks@4.2.0) (2020-01-17)


### 🚀 Features

* Add indexes to Entity for improved performance ([#237](https://github.com/coinbase/rest-hooks/issues/237)) ([a2339f0](https://github.com/coinbase/rest-hooks/commit/a2339f0e61e9446da87af85440061b060ad0f444))


### 💅 Enhancement

* Devmode: Throw error if delete shape fetched with wrong schema ([#240](https://github.com/coinbase/rest-hooks/issues/240)) ([130e070](https://github.com/coinbase/rest-hooks/commit/130e07059936d255d72ef9ee35a738c755fada00))
* Don't export action types ([#239](https://github.com/coinbase/rest-hooks/issues/239)) ([41fedfe](https://github.com/coinbase/rest-hooks/commit/41fedfe1890834950e5330c61329abe6d734e768))


### 🐛 Bug Fix

* Test coverage ([c3d51e2](https://github.com/coinbase/rest-hooks/commit/c3d51e2927d48dfdda51764fc6e0fabb27b4dbaf))



### [4.1.3](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.1.2...rest-hooks@4.1.3) (2020-01-16)


### 💅 Enhancement

* Centralize action type string definitions ([#238](https://github.com/coinbase/rest-hooks/issues/238)) ([b558986](https://github.com/coinbase/rest-hooks/commit/b558986b1c17bc4217d4d5ec9d31d28e410e9725))



### [4.1.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.1.0...rest-hooks@4.1.2) (2020-01-14)


### 🐛 Bug Fix

* Make SubscriptionManager type compatible with redux-toolkit ([#235](https://github.com/coinbase/rest-hooks/issues/235)) ([9e04388](https://github.com/coinbase/rest-hooks/commit/9e04388114dcb2f31da37a29cc5971661241e80c))
* Re-publish correct typings ([3520594](https://github.com/coinbase/rest-hooks/commit/3520594b090ff1231e1d8c65620257af46e8ffcb))



## [4.1.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.4...rest-hooks@4.1.0) (2020-01-06)


### 🚀 Features

* Entity class added to Resource hierarchy ([#226](https://github.com/coinbase/rest-hooks/issues/226)) ([7c4efb7](https://github.com/coinbase/rest-hooks/commit/7c4efb7a55efbffa8a0cab3dab1b39e69535df49))


### 🏠 Internal

* Avoid circular depdency (and note it) ([a47cf7e](https://github.com/coinbase/rest-hooks/commit/a47cf7e5518883d4afe95fe34324220e5aa33d45))



### [4.0.4](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.3...rest-hooks@4.0.4) (2020-01-05)


### 🐛 Bug Fix

* Import @rest-hooks/normalizr properly ([#229](https://github.com/coinbase/rest-hooks/issues/229)) ([c9d0474](https://github.com/coinbase/rest-hooks/commit/c9d04740ce2c8823f812c91a230b46077c286873))



### [4.0.3](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.2...rest-hooks@4.0.3) (2020-01-05)


### 🐛 Bug Fix

* Type inferencing for hooks ([1fa5f2c](https://github.com/coinbase/rest-hooks/commit/1fa5f2c368ad4485e808fd3ee4d4e6bc36bd39e7))



### [4.0.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.1...rest-hooks@4.0.2) (2020-01-05)


### 💅 Enhancement

* Immediately fetch polling subscriptions ([#228](https://github.com/coinbase/rest-hooks/issues/228)) ([ae02bff](https://github.com/coinbase/rest-hooks/commit/ae02bfffc08d16cd41e6c285a8ddf1b802302e9b))
* Polling subscriptions handle offline/online ([#227](https://github.com/coinbase/rest-hooks/issues/227)) ([38c9bc6](https://github.com/coinbase/rest-hooks/commit/38c9bc6b3aad62ad0ea17d43f366b98a968e529e))



### [4.0.1](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.0...rest-hooks@4.0.1) (2019-12-31)


### 🏠 Internal

* Move normalizr code into repo ([#212](https://github.com/coinbase/rest-hooks/issues/212)) ([7d290f4](https://github.com/coinbase/rest-hooks/commit/7d290f404016073b64b4cddfc723e3591241b358))


### 📝 Documentation

* Fix svg links in README ([7cad255](https://github.com/coinbase/rest-hooks/commit/7cad255a338f14fd165b54d79aa337f6dafe3c6a))



## [4.0.0](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.0-beta.5...rest-hooks@4.0.0) (2019-12-23)

**Note:** Version bump only for package rest-hooks





## [4.0.0-beta.5](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.0-beta.4...rest-hooks@4.0.0-beta.5) (2019-12-23)


### 💅 Enhancement

* Non-ES bundlers will use IE11 compatible build ([29eaefc](https://github.com/coinbase/rest-hooks/commit/29eaefcf380830a5bb0be92254d3217b371c893c))
* Remove extraneous generics on Resource statics ([3be6a6a](https://github.com/coinbase/rest-hooks/commit/3be6a6a17a789f6a3909cf0d7401aa1394be8196))



## [4.0.0-beta.4](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.0-beta.3...rest-hooks@4.0.0-beta.4) (2019-12-22)


### ⚠ 💥 BREAKING CHANGES

* * url() and listUrl() params are no longer optional
* Removed resolveFetchData() in favor of fetchResponse().
  * fetch() now calls fetchResponse()
  * This means custom use of Response can be achieved by calling
fetchResponse() in custom FetchShape.fetch
* Remove generic signatures to any Resource.fetch()
overrides

### 🚀 Features

* export SimpleRecord which has the data methods of Resource ([#203](https://github.com/coinbase/rest-hooks/issues/203)) ([0c0dd49](https://github.com/coinbase/rest-hooks/commit/0c0dd4932a1c33c7477d77252f6a11b5adb3be5e))


### 💅 Enhancement

* Easier to handle http fetch headers in response ([#208](https://github.com/coinbase/rest-hooks/issues/208)) ([86074a6](https://github.com/coinbase/rest-hooks/commit/86074a6f51acf0c689a74386c2ee9be3efc240d5))
* Include context in error message when failing to build PK ([b754a64](https://github.com/coinbase/rest-hooks/commit/b754a64bc506f2b88a5e307b215f57c20c21abb5))
* Resource.fetch() is no longer generic ([#207](https://github.com/coinbase/rest-hooks/issues/207)) ([e41da6c](https://github.com/coinbase/rest-hooks/commit/e41da6cf175f0c8e901e7f0f4dd90920f836a1e3))


### 🐛 Bug Fix

* NetworkError type export should not be exposed to js build ([de9413c](https://github.com/coinbase/rest-hooks/commit/de9413c0cf29bc9e8aa752494e749f607370b8a3))
* Tests run in node 12 ([#202](https://github.com/coinbase/rest-hooks/issues/202)) ([58e55e0](https://github.com/coinbase/rest-hooks/commit/58e55e0d08f1d79ab4b24408dbd5603afb8e8505))


### 📦 Package

* testing ([138c846](https://github.com/coinbase/rest-hooks/commit/138c846035e704d78f751156e5587366310edf98))


### 🏠 Internal

* Ignore process.env.NODE_ENV checks for coverage ([e71a0c1](https://github.com/coinbase/rest-hooks/commit/e71a0c1b7244ecf3e9db15e27600c7fb35a9a0d4))
* Update lint rules ([#206](https://github.com/coinbase/rest-hooks/issues/206)) ([732f875](https://github.com/coinbase/rest-hooks/commit/732f87536e23d6b43cea3abce5be8cd6f1dd75c7))



## [4.0.0-beta.3](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.0-beta.2...rest-hooks@4.0.0-beta.3) (2019-12-16)


### ⚠ 💥 BREAKING CHANGES

* * fetchPlugin -> fetchOptionsPlugin, which has different signature
* No more SuperagentResource export
* New overridable Resource.resolveFetchData()

### 💅 Enhancement

* Resource.fetch uses fetch instead of superagent ([#199](https://github.com/coinbase/rest-hooks/issues/199)) ([5c740ec](https://github.com/coinbase/rest-hooks/commit/5c740ecf8f864e33cd9a6ab6cbc0a872ba0344ed))



## [4.0.0-beta.2](https://github.com/coinbase/rest-hooks/compare/rest-hooks@4.0.0-beta.1...rest-hooks@4.0.0-beta.2) (2019-12-11)


### 🐛 Bug Fix

* Add lodash types ([#198](https://github.com/coinbase/rest-hooks/issues/198)) ([0523401](https://github.com/coinbase/rest-hooks/commit/05234010b884cbfcf1d5341a5bd5b318a1260360))
* export PromiseifyMiddleware ([#197](https://github.com/coinbase/rest-hooks/issues/197)) ([89370ff](https://github.com/coinbase/rest-hooks/commit/89370ffccaee39a6e147b449a76a1ce9778f7010))


### 🏠 Internal

* React.createContext -> createContext ([c5ff9cc](https://github.com/coinbase/rest-hooks/commit/c5ff9ccd41e1d4bf92aed3bf0ff9a42edaaa8985))


### 📝 Documentation

* Point to repository directory for npm ([942a563](https://github.com/coinbase/rest-hooks/commit/942a563493d35dca9787e541dd89599d2059be1c))



## 4.0.0-beta.1 (2019-12-02)


### ⚠ 💥 BREAKING CHANGES

* rest-hooks/test -> @rest-hooks/test

### 🚀 Features

* New @rest-hooks/legacy package ([#187](https://github.com/coinbase/rest-hooks/issues/187)) ([78c9321](https://github.com/coinbase/rest-hooks/commit/78c9321f3560d2ea57b4c8478e9bdd789762ae13))


### 💅 Enhancement

* Move testing modules to own package ([#182](https://github.com/coinbase/rest-hooks/issues/182)) ([174461a](https://github.com/coinbase/rest-hooks/commit/174461a3c7568c53842eb6f4ea64e5b85dd20ce5))


### 📦 Package

* Update dev: types and linting ([#186](https://github.com/coinbase/rest-hooks/issues/186)) ([78e36a4](https://github.com/coinbase/rest-hooks/commit/78e36a49eba85d7839c13f871e9a5985eeeb2458))


### 🏠 Internal

* Centralize babel config & common test ([#189](https://github.com/coinbase/rest-hooks/issues/189)) ([16d22a3](https://github.com/coinbase/rest-hooks/commit/16d22a3ea0dab1b48ae59cdbd3ef8d53c33167f8))
* Use TypeScript project references ([#188](https://github.com/coinbase/rest-hooks/issues/188)) ([412c674](https://github.com/coinbase/rest-hooks/commit/412c6740cd825b06e8784d0d0f4d39e6cb331062))


### 📝 Documentation

* Update useStatefulResource() in guides ([#183](https://github.com/coinbase/rest-hooks/issues/183)) ([0e59914](https://github.com/coinbase/rest-hooks/commit/0e599141b0cc9540428def9e26ea228275df899b))



# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/coinbase/rest-hooks/releases) page.
