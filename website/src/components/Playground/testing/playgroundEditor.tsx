import { createElement } from 'react';

/** The code editor as a plain textarea holding the code, for tests that
 * render a whole Playground: `jest.mock('../PlaygroundEditor', () =>
 * require('../testing/playgroundEditor'))` */
export default function PlaygroundEditor({ code }: { code: string }) {
  return createElement('textarea', { defaultValue: code });
}
