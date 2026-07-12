import type { FixtureEndpoint } from '@data-client/test';
import { createContext } from 'react';

const CodeTabContext = createContext({
  selectedValue: '',
  setSelectedValue: (
    _event: React.FocusEvent<HTMLElement> | React.MouseEvent<HTMLElement>,
  ): void => {
    throw new Error('No Tab provider');
  },
  values: [] as {
    label: string;
    value: string;
    code: { code: string; path: string; open?: true }[];
    autoFocus?: boolean;
    fixtures?: FixtureEndpoint[];
  }[],
});
export default CodeTabContext;
