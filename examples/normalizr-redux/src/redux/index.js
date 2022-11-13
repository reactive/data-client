import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import api from '../api';
import * as schema from '../api/schema';
import reducer from './reducer';

export default createStore(
  reducer,
  applyMiddleware(thunk.withExtraArgument({ api, schema })),
);
