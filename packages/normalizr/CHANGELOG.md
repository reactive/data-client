# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.0-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.6...@rest-hooks/normalizr@6.0.0-beta.0) (2020-04-26)


### ⚠ 💥 BREAKING CHANGES

* TypeScript 3.7 or higher is required. This uses type
recursion.

### 🚀 Features

* Simplified Entity class ([#315](https://github.com/coinbase/rest-hooks/issues/315)) ([0e6bfcb](https://github.com/coinbase/rest-hooks/commit/0e6bfcb3620006e285510d4e5121fce743214d55))


### 💅 Enhancement

* More readable array return types ([#314](https://github.com/coinbase/rest-hooks/issues/314)) ([4ac8918](https://github.com/coinbase/rest-hooks/commit/4ac8918df19a4d386ff717c3ceef40e151c60c1f))


### 📦 Package

* Bump internal pkgs ([#306](https://github.com/coinbase/rest-hooks/issues/306)) ([46bebad](https://github.com/coinbase/rest-hooks/commit/46bebad79d848404d02423fd2a3e2d647ee5bbbb))


### 🏠 Internal

* Hoist coveralls to root, since testing is done there ([3b1dbaa](https://github.com/coinbase/rest-hooks/commit/3b1dbaac303048a1b1e543f99fb9758b21feb083))
* Update packages in redux example ([dbba679](https://github.com/coinbase/rest-hooks/commit/dbba67935a7b756d66ce7b6cb9e2d93e7f2ce44a))



### [5.0.6](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.5...@rest-hooks/normalizr@5.0.6) (2020-03-13)


### 🐛 Bug Fix

* Schema can be null (for media) ([#293](https://github.com/coinbase/rest-hooks/issues/293)) ([003b3ca](https://github.com/coinbase/rest-hooks/commit/003b3ca53703174b66c5fc9d546d2b340e293e86))



### [5.0.5](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.4...@rest-hooks/normalizr@5.0.5) (2020-02-26)


### 🏠 Internal

* readonly should exist on all levels of internal state ([#276](https://github.com/coinbase/rest-hooks/issues/276)) ([a884186](https://github.com/coinbase/rest-hooks/commit/a884186e2696b40ab764979d646089aa625dfe8d))
* Use Record<string, any> form for POJOs ([dae11b2](https://github.com/coinbase/rest-hooks/commit/dae11b233d4cc3d56ba93f1488a0b42ba7a1dfce))



### [5.0.4](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.3...@rest-hooks/normalizr@5.0.4) (2020-02-19)


### 🏠 Internal

* Check compressed size changes on PR ([#270](https://github.com/coinbase/rest-hooks/issues/270)) ([d70ccbf](https://github.com/coinbase/rest-hooks/commit/d70ccbf44ac5ba8fdc4f70886851ab18349f37e6))



### [5.0.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.3-beta.0...@rest-hooks/normalizr@5.0.3) (2020-02-18)

**Note:** Version bump only for package @rest-hooks/normalizr





### [5.0.3-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.2...@rest-hooks/normalizr@5.0.3-beta.0) (2020-02-18)


### 🏠 Internal

* Centralize jest config ([#230](https://github.com/coinbase/rest-hooks/issues/230)) ([5d769d2](https://github.com/coinbase/rest-hooks/commit/5d769d2485fe62ba65f4176894768bdbb6faafb3))



### [5.0.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.2-beta.0...@rest-hooks/normalizr@5.0.2) (2020-02-10)

**Note:** Version bump only for package @rest-hooks/normalizr





### [5.0.2-beta.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.1...@rest-hooks/normalizr@5.0.2-beta.0) (2020-02-04)

**Note:** Version bump only for package @rest-hooks/normalizr





### [5.0.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@5.0.0...@rest-hooks/normalizr@5.0.1) (2020-01-29)


### 🐛 Bug Fix

* ES export is non-min version ([4b04b62](https://github.com/coinbase/rest-hooks/commit/4b04b629e67cce295c82743cb6d3a6d9f99df506))



## [5.0.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.3.3...@rest-hooks/normalizr@5.0.0) (2020-01-29)


### ⚠ 💥 BREAKING CHANGES

* Remove denormalizeAndTracked

### 💅 Enhancement

* Only export one denormalize ([3f77da2](https://github.com/coinbase/rest-hooks/commit/3f77da206c1e4bc4065b98c8bdcfcfa3693586b7))
* Use minified build for es modules ([a1a760c](https://github.com/coinbase/rest-hooks/commit/a1a760c74f5f389951ec1c827403e02bf5fb2442))


### 🐛 Bug Fix

* **schemas:** don't use schema to attribute mapping on singular array schemas ([a39d3e5](https://github.com/coinbase/rest-hooks/commit/a39d3e5402adfaef4651e0e8efeea0f1587186d5))


### 🏠 Internal

* Upgrade jest to 25 ([#253](https://github.com/coinbase/rest-hooks/issues/253)) ([745a253](https://github.com/coinbase/rest-hooks/commit/745a2532cb1ec3471f1fcb9c90fd87ffb55d6d1a))



### [4.3.3](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.3.2...@rest-hooks/normalizr@4.3.3) (2020-01-27)


### 💅 Enhancement

* Keep referential equality in list views ([#251](https://github.com/coinbase/rest-hooks/issues/251)) ([caf2bf7](https://github.com/coinbase/rest-hooks/commit/caf2bf78e6c48af8a32b080291ae60615ad05b34))



### [4.3.2](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.3.1...@rest-hooks/normalizr@4.3.2) (2020-01-18)


### 🐛 Bug Fix

* Support extra members of schema that are empty in denormalize ([#244](https://github.com/coinbase/rest-hooks/issues/244)) ([86b1e0a](https://github.com/coinbase/rest-hooks/commit/86b1e0a30b87156f144629df8e24933a7f90ba66))



### [4.3.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.3.0...@rest-hooks/normalizr@4.3.1) (2020-01-18)


### 🐛 Bug Fix

* Support extra members of schema that are only sometimes empty ([#243](https://github.com/coinbase/rest-hooks/issues/243)) ([74916a3](https://github.com/coinbase/rest-hooks/commit/74916a3f9c5a0e5a9843a6211517dfeff1b86eb6))



## [4.3.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.2.0...@rest-hooks/normalizr@4.3.0) (2020-01-17)


### 🚀 Features

* Add indexes to Entity for improved performance ([#237](https://github.com/coinbase/rest-hooks/issues/237)) ([a2339f0](https://github.com/coinbase/rest-hooks/commit/a2339f0e61e9446da87af85440061b060ad0f444))



## [4.2.0](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.1.1...@rest-hooks/normalizr@4.2.0) (2020-01-06)


### 🚀 Features

* Entity class added to Resource hierarchy ([#226](https://github.com/coinbase/rest-hooks/issues/226)) ([7c4efb7](https://github.com/coinbase/rest-hooks/commit/7c4efb7a55efbffa8a0cab3dab1b39e69535df49))



### [4.1.1](https://github.com/coinbase/rest-hooks/compare/@rest-hooks/normalizr@4.1.0...@rest-hooks/normalizr@4.1.1) (2020-01-05)


### 💅 Enhancement

* Remove extraneous logic - schema is not allowed to be null ([775cc8a](https://github.com/coinbase/rest-hooks/commit/775cc8a47a7d016f3f33766aee83a0154b7385ac))


### 📦 Package

* Build things ([9d386aa](https://github.com/coinbase/rest-hooks/commit/9d386aa1ab944159f5ed4576b81d8d5e5f67847b))


### 🏠 Internal

* Run normalizr typescript tests ([#223](https://github.com/coinbase/rest-hooks/issues/223)) ([17a3f84](https://github.com/coinbase/rest-hooks/commit/17a3f84a390762173843736ad0b2d6a3ef8e031f))



## 4.1.0 (2019-12-31)


### 🚀 Features

* Support string schemas ([#222](https://github.com/coinbase/rest-hooks/issues/222)) ([3f025de](https://github.com/coinbase/rest-hooks/commit/3f025def8de1d949962f99c4411bca86a2e22b1f))


### 🏠 Internal

* **deps:** bump extend in /packages/normalizr/examples/redux ([#218](https://github.com/coinbase/rest-hooks/issues/218)) ([96f31bf](https://github.com/coinbase/rest-hooks/commit/96f31bf78bb218994ce7538a48178fc3a8440354))
* **deps:** bump sshpk in /packages/normalizr/examples/redux ([#217](https://github.com/coinbase/rest-hooks/issues/217)) ([56e4a16](https://github.com/coinbase/rest-hooks/commit/56e4a16bbfb861e3acfdb7ccec353991fb07e2ab))
* **deps:** bump stringstream in /packages/normalizr/examples/redux ([#216](https://github.com/coinbase/rest-hooks/issues/216)) ([f57648a](https://github.com/coinbase/rest-hooks/commit/f57648a3ed77ca4f4592bf655fe40f045b024b77))
* **deps:** bump tar in /packages/normalizr/examples/redux ([#220](https://github.com/coinbase/rest-hooks/issues/220)) ([1575c65](https://github.com/coinbase/rest-hooks/commit/1575c655d9fdc2bc0034095ab935aed47a439d6c))
* **deps:** bump tough-cookie in /packages/normalizr/examples/redux ([#221](https://github.com/coinbase/rest-hooks/issues/221)) ([2088197](https://github.com/coinbase/rest-hooks/commit/20881979e883b96def82948bce3583dc02f3f66b))
* Move normalizr code into repo ([#212](https://github.com/coinbase/rest-hooks/issues/212)) ([7d290f4](https://github.com/coinbase/rest-hooks/commit/7d290f404016073b64b4cddfc723e3591241b358))
