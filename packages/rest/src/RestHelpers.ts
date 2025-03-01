import { compile, PathFunction, parse } from 'path-to-regexp';

import { ShortenPath } from './pathTypes.js';

const urlBaseCache: Map<string, PathFunction<object>> = new Map();
export function getUrlBase(path: string): PathFunction {
  if (!urlBaseCache.has(path)) {
    urlBaseCache.set(
      path,
      compile(path, {
        encode: encodeURIComponent,
        validate: false,
      }),
    );
  }
  return urlBaseCache.get(path) as PathFunction;
}

const urlTokensCache: Map<string, Set<string>> = new Map();
export function getUrlTokens(path: string): Set<string> {
  if (!urlTokensCache.has(path)) {
    urlTokensCache.set(
      path,
      new Set(
        parse(path).map(t => (typeof t === 'string' ? t : `${t['name']}`)),
      ),
    );
  }
  return urlTokensCache.get(path) as Set<string>;
}

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

export function isPojo(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}

export function shortenPath<S extends string>(path: S): ShortenPath<S> {
  const lastColonIndex = path.lastIndexOf(':');
  if (lastColonIndex === -1)
    throw new Error('Resource path requires at least one :parameter');
  // this is for when not specifying a specific item like create/list
  let shortUrlRoot: ShortenPath<S> = path.substring(0, lastColonIndex) as any;
  if (shortUrlRoot[shortUrlRoot.length - 1] === '/')
    shortUrlRoot = shortUrlRoot.substring(
      0,
      shortUrlRoot.length - 1,
    ) as ShortenPath<S>;
  return shortUrlRoot;
}
