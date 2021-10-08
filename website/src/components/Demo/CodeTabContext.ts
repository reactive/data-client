import { createContext } from 'react';

const CodeTabContext = createContext({
  selectedValue: '',
  setSelectedValue: (value: string): void => {
    throw new Error('No Tab provider');
  },
  values: [],
});
export default CodeTabContext;
