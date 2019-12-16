# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
