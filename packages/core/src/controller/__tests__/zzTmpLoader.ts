import { Entity } from '@data-client/endpoint';
import { resource } from '@data-client/rest';

import { ExpiryStatus } from '../..';
import { initialState } from '../../state/reducer/createReducer';
import Controller from '../Controller';

class Discussion extends Entity {
  id = '';
  title = '';
}
const DiscussionResource = resource({ path: '/discussions/:id', schema: Discussion });

function run(state: any) {
  const ctrl = new Controller({ dispatch: (() => Promise.resolve()) as any, getState: () => state });
  const args = { id: '5' };
  const r = ctrl.getResponseMeta(DiscussionResource.get, args, ctrl.getState());
  return { data: r.data, expiryStatus: r.expiryStatus, expiresAt: r.expiresAt, awaits: r.expiryStatus === ExpiryStatus.Invalid };
}
it('cases', () => {
  const key = DiscussionResource.get.key({ id: '5' });
  const ent = { Discussion: { 5: { id: '5', title: 'hi' } } };
  console.log(JSON.stringify({
    coldMiss: run(initialState),
    entityOnlyFresh: run({ ...initialState, entities: ent, entitiesMeta: { Discussion: { 5: { expiresAt: Date.now() + 1e5, date: 0, fetchedAt: 0 } } } }),
    cachedStale: run({ ...initialState, entities: ent, endpoints: { [key]: '5' }, meta: { [key]: { expiresAt: 5, date: 0 } } }),
    invalidated: run({ ...initialState, entities: ent, endpoints: { [key]: '5' }, meta: { [key]: { expiresAt: 0, date: 0, invalidated: true } } }),
    errorNoData: run({ ...initialState, meta: { [key]: { expiresAt: Date.now() + 1e5, date: 0, error: new Error('x') } } }),
  }, null, 1));
});
