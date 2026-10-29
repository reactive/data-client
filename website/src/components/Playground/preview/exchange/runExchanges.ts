import React from 'react';
import { transform } from 'sucrase';

import { networkScope, type Exchange } from './network';
import type { CodeDocument } from '../../editor/codeModel';
import type { FixtureOrInterceptor } from '../../types';
import { previewScope } from '../scope';
import { joinDocuments, scopeBlock } from '../transformCode';

/** The playground's scripts as one program to run with `runExchanges`
 *
 * @throws SyntaxError when they don't compile
 */
export function compileExchanges(documents: readonly CodeDocument[]): string {
  return transform(scopeBlock(joinDocuments(documents.filter(isScript))), {
    transforms: ['typescript', 'jsx'],
    production: true,
  }).code;
}

/** Runs `program` as the live preview would, its endpoints answered by
 * `fixtures`, each run against fresh interceptor data.
 *
 * @returns each endpoint call's exchange, in call order
 * @throws what the code throws as it runs
 */
export function runExchanges(
  program: string,
  fixtures: readonly FixtureOrInterceptor[],
  getInitialInterceptorData: () => unknown = () => ({}),
): Promise<Exchange>[] {
  const calls: Promise<Exchange>[] = [];
  const scope: Record<string, unknown> = {
    React,
    ...previewScope,
    ...networkScope({
      fixtures,
      interceptorData: getInitialInterceptorData(),
      onCall: exchange => calls.push(exchange),
    }),
  };
  new Function(...Object.keys(scope), program)(...Object.values(scope));
  return calls;
}

/** Other files (a Vue SFC beside the endpoints) are for reading */
const isScript = ({ language }: CodeDocument) =>
  /^(tsx?|jsx?|typescript|javascript)$/.test(language);
