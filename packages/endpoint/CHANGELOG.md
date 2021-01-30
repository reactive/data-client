# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
