import type { Fixture, Interceptor } from '@data-client/test';
import { createContext } from 'react';

import type { AutoRunScript } from '../Playground/preview/autorun/script';

export interface CodeTabValue {
  label: string;
  value: string;
  code: { code: string; path: string; open?: boolean; ssr?: boolean }[];
  autoFocus?: boolean;
  fixtures?: (Fixture | Interceptor)[];
  getInitialInterceptorData?: () => unknown;
  autoRun?: AutoRunScript;
}

const CodeTabContext = createContext({
  selectedValue: '',
  setSelectedValue: (_value: string): void => {
    throw new Error('No Tab provider');
  },
  values: [] as CodeTabValue[],
});
export default CodeTabContext;
