import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import reducer from './reducer';
import api from '../api';
import * as schema from '../api/schema';

export default createStore(
  reducer,
  applyMiddleware(thunk.withExtraArgument({ api, schema })),
);
