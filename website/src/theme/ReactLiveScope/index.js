/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as endpoint from '@data-client/endpoint';
import React from 'react';

// Add react-live imports you need here
const ReactLiveScope = {
  React,
  ...React,
  ...endpoint,
};

export default ReactLiveScope;
