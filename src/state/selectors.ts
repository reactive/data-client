import { createSelector } from 'reselect';
import { AbstractInstanceType } from '../types';
import { Resource } from '../resource';
import { State, PK } from '../types';

export function makeSingle<T extends typeof Resource>(Resource: T) {
  return (
    state: State<Resource>,
    urlParams: Partial<AbstractInstanceType<T>>,
  ) => {
    let id = Resource.pk(urlParams);
    if (id === null || id === undefined) {
      const url = Resource.url(urlParams);
      const results = state.results[url];
      if (process.env.NODE_ENV !== 'production') {
        if (Array.isArray(results)) {
          throw new Error(
            `url ${url} has list results when single result is expected`,
          );
        }
        if (typeof results === 'object') {
          throw new Error(
            `url ${url} has object results when single result is expected`,
          );
        }
      }
      if (results === undefined) return null;
      id = results as PK;
    }
    const resourceEntitySection = state.entities[Resource.getKey()];
    if (!resourceEntitySection) return null;
    const instance = resourceEntitySection[id];
    if (!instance) return null;
    if (!(instance instanceof Resource)) {
      throw new Error(
        `entity of wrong type found for ${Resource.toString()} : ${id}`,
      );
    }
    return instance as AbstractInstanceType<T>;
  };
}

export function ByPK<T extends typeof Resource>(
  Resource: T,
  state: State<Resource>,
  pk: PK,
) {
  const resourceEntitySection = state.entities[Resource.getKey()];
  if (!resourceEntitySection) return null;
  return resourceEntitySection[pk];
}

export function All<T extends typeof Resource>(
  Resource: T,
  state: State<Resource>,
) {
  const resourceEntitySection = state.entities[Resource.getKey()];
  if (!resourceEntitySection) return [];
  return Object.values(resourceEntitySection);
}

export function selectMeta(state: State<Resource>, url: string) {
  return state.meta[url];
}

export const makeEntities = <T extends typeof Resource>(Resource: T) => (
  state: State<Resource>,
) => {
  const resourceEntitySection = state.entities[Resource.getKey()];
  if (!resourceEntitySection) return null;
  return resourceEntitySection;
};

export const makeResults = (
  getUrl: (...args: any[]) => string,
) => (state: State<Resource>, params: object) => state.results[getUrl(params)] || null;


export function makeList<T extends typeof Resource>(Resource: T, getResultList?: (results: any) => PK[]) {
  const selectEntities = makeEntities(Resource);
  const selectResults = makeResults((v) => Resource.listUrl(v));
  return createSelector(
    selectEntities,
    selectResults,
    (entities, results) => {
      if (!entities || !results) return null;
      if (getResultList) {
        results = getResultList(results)
      }
      if (!Array.isArray(results)) {
        throw new Error(`does not have list when list expected`);
      }
      return results.map(pk => entities[pk]) as AbstractInstanceType<T>[]
    }
  );
}
