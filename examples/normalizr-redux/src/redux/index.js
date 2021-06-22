import thunk from 'redux-thunk';
import { applyMiddleware, createStore } from 'redux';

import * as schema from '../api/schema';
import api from '../api';
import reducer from './reducer';

export default createStore(
  reducer,
  applyMiddleware(thunk.withExtraArgument({ api, schema })),
);
