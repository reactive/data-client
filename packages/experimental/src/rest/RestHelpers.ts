import { compile, PathFunction, parse } from 'path-to-regexp';

import { ShortenPath } from './types';

const urlBaseCache: Record<string, PathFunction<object>> = {};
export function getUrlBase(urlRoot: string): PathFunction {
  if (!Object.hasOwnProperty.call(urlBaseCache, urlRoot)) {
    urlBaseCache[urlRoot] = compile(urlRoot, {
      encode: encodeURIComponent,
      validate: false,
    });
  }
  return urlBaseCache[urlRoot];
}

const urlTokensCache: Record<string, Set<string>> = {};
export function getUrlTokens(urlRoot: string): Set<string> {
  if (!Object.hasOwnProperty.call(urlTokensCache, urlRoot)) {
    urlTokensCache[urlRoot] = new Set(
      parse(urlRoot).map(t => (typeof t === 'string' ? t : `${t['name']}`)),
    );
  }
  return urlTokensCache[urlRoot];
}

const proto = Object.prototype;
const gpo = Object.getPrototypeOf;

export function isPojo(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  return gpo(obj) === proto;
}

export function shortenUrlRoot<S extends string>(urlRoot: S): ShortenPath<S> {
  // this is for when not specifying a specific item like create/list
  let shortUrlRoot: ShortenPath<S> = urlRoot.substring(
    0,
    urlRoot.lastIndexOf(':'),
  ) as any;
  if (shortUrlRoot[shortUrlRoot.length - 1] === '/')
    shortUrlRoot = shortUrlRoot.substring(
      0,
      shortUrlRoot.length - 1,
    ) as ShortenPath<S>;
  return shortUrlRoot;
}
