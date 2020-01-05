# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
