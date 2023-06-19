import type { FixtureEndpoint } from '@data-client/test';
import { createContext } from 'react';

const CodeTabContext = createContext({
  selectedValue: '',
  setSelectedValue: (
    event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
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
