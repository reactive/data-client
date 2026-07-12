import type { FixtureEndpoint } from '@data-client/test';
import { createContext } from 'react';

export interface CodeTabValue {
  label: string;
  value: string;
  code: { code: string; path: string; open?: true }[];
  autoFocus?: boolean;
  fixtures?: FixtureEndpoint[];
  getInitialInterceptorData?: () => unknown;
}

const CodeTabContext = createContext({
  selectedValue: '',
  setSelectedValue: (_value: string): void => {
    throw new Error('No Tab provider');
  },
  values: [] as CodeTabValue[],
});
export default CodeTabContext;
