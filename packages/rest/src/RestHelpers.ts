import { compile, PathFunction, parse } from 'path-to-regexp';

import { ShortenPath } from './pathTypes.js';

const urlBaseCache: Record<string, PathFunction<object>> = {};
export function getUrlBase(path: string): PathFunction {
  if (!Object.hasOwn(urlBaseCache, path)) {
    urlBaseCache[path] = compile(path, {
      encode: encodeURIComponent,
      validate: false,
    });
  }
  return urlBaseCache[path];
}

const urlTokensCache: Record<string, Set<string>> = {};
export function getUrlTokens(path: string): Set<string> {
  if (!Object.hasOwn(urlTokensCache, path)) {
    urlTokensCache[path] = new Set(
      parse(path).map(t => (typeof t === 'string' ? t : `${t['name']}`)),
    );
  }
  return urlTokensCache[path];
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
  // this is for when not specifying a specific item like create/list
  let shortUrlRoot: ShortenPath<S> = path.substring(
    0,
    path.lastIndexOf(':'),
  ) as any;
  if (shortUrlRoot[shortUrlRoot.length - 1] === '/')
    shortUrlRoot = shortUrlRoot.substring(
      0,
      shortUrlRoot.length - 1,
    ) as ShortenPath<S>;
  return shortUrlRoot;
}
