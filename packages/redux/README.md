# [![Reactive Data Client](./data_client_logo_and_text.svg?sanitize=true)](https://dataclient.io)

[![CircleCI](https://circleci.com/gh/reactive/data-client/tree/master.svg?style=shield)](https://circleci.com/gh/reactive/data-client)
[![Coverage Status](https://img.shields.io/codecov/c/gh/reactive/data-client/master.svg?style=flat-square)](https://app.codecov.io/gh/reactive/data-client?branch=master)
[![npm downloads](https://img.shields.io/npm/dm/@data-client/redux.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/redux)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@data-client/redux?style=flat-square)](https://bundlephobia.com/result?p=@data-client/redux)
[![npm version](https://img.shields.io/npm/v/@data-client/redux.svg?style=flat-square)](https://www.npmjs.com/package/@data-client/redux)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[Redux](https://redux.js.org/) integration for [Reactive Data Client](https://dataclient.io/)

## 🚨 Repository Deprecated and Moved! 🚨

**This repository has been deprecated and is no longer actively maintained.** Please use [@data-client/react/redux](https://dataclient.io/docs/guides/redux)
from [@data-client/react](https://www.npmjs.com/package/@data-client/react)

```tsx title="index.tsx"
import {
  ExternalDataProvider,
  prepareStore,
  type Middleware,
} from '@data-client/react/redux';
import { getDefaultManagers, Controller } from '@data-client/react';
import ReactDOM from 'react-dom';

const managers = getDefaultManagers();
// be sure to include your other reducers here
const otherReducers = {};
const extraMiddlewares: Middleware = [];

const { store, selector, controller } = prepareStore(
  initialState,
  managers,
  Controller,
  otherReducers,
  extraMiddlewares,
);

ReactDOM.render(
  <ExternalDataProvider
    store={store}
    selector={selector}
    controller={controller}
  >
    <App />
  </ExternalDataProvider>,
  document.body,
);
```