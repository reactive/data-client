import { reducer, createReceive, initialState } from '@rest-hooks/core';

import data from './data.json';
import { ProjectSchema } from './schemas';

export default function addReducerSuite(suite) {
  const state = initialState;
  const action = createReceive(data, { schema: ProjectSchema, key: '/fake' });

  return suite.add('receiveLong', () => {
    return reducer(state, action);
  });
}
