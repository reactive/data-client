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
 * `fixtures`, each run against fresh interceptor data. `onCall` gets each
 * endpoint call's exchange in call order, including calls the code makes
 * later (after an await).
 *
 * @throws what the code throws as it first runs
 */
export function runExchanges(
  program: string,
  fixtures: readonly FixtureOrInterceptor[],
  onCall: (exchange: Promise<Exchange>) => void,
  getInitialInterceptorData: () => unknown = () => ({}),
): void {
  const scope: Record<string, unknown> = {
    React,
    ...previewScope,
    ...networkScope({
      fixtures,
      interceptorData: getInitialInterceptorData(),
      onCall,
    }),
  };
  new Function(...Object.keys(scope), program)(...Object.values(scope));
}

/** Runs `program`, reporting the exchange its last call makes (a call made
 * later, after an await, takes over, and a superseded call's answer is
 * dropped) or the error it threw, which outlasts any answer. With no call
 * it reports `{}`. Returns a function that stops the reports. */
export function runLive(
  program: string,
  fixtures: readonly FixtureOrInterceptor[],
  getInitialInterceptorData: (() => unknown) | undefined,
  report: (outcome: { exchange?: Exchange; error?: string }) => void,
): () => void {
  let current = true;
  let threw = false;
  let lastCall: Promise<Exchange> | undefined;
  const shown = (call: Promise<Exchange>) =>
    current && !threw && call === lastCall;
  try {
    runExchanges(
      program,
      fixtures,
      call => {
        lastCall = call;
        // every call is handled, so a superseded failure is dropped
        call.then(
          exchange => shown(call) && report({ exchange }),
          error => shown(call) && report({ error: `${error}` }),
        );
      },
      getInitialInterceptorData,
    );
  } catch (error) {
    threw = true;
    report({ error: `${error}` });
  }
  if (!lastCall && !threw) report({});
  return () => {
    current = false;
  };
}

/** Other files (a Vue SFC beside the endpoints) are for reading */
const isScript = ({ language }: CodeDocument) =>
  /^(tsx?|jsx?|typescript|javascript)$/.test(language);
