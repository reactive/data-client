import { compile, PathFunction, parse, Token, ParamData } from 'path-to-regexp';

import { ShortenPath } from './pathTypes.js';

const urlBaseCache: Record<string, PathFunction<object>> = Object.create(null);
export function getUrlBase(path: string): PathFunction<ParamData> {
  if (!(path in urlBaseCache)) {
    urlBaseCache[path] = compile(path);
  }
  return urlBaseCache[path];
}

const urlTokensCache: Record<string, Set<string>> = Object.create(null);
export function getUrlTokens(path: string): Set<string> {
  if (!(path in urlTokensCache)) {
    urlTokensCache[path] = tokenMap(parse(path).tokens);
  }
  return urlTokensCache[path];
}

function tokenMap(tokens: Token[]): Set<string> {
  const tokenNames = new Set<string>();
  tokens.forEach(token => {
    switch (token.type) {
      case 'param':
      case 'wildcard':
        tokenNames.add(token.name);
        break;
      case 'group':
        return tokenNames.union(tokenMap(token.tokens));
    }
  });
  return tokenNames;
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
