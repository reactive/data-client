import { createContext } from 'react';

const CodeTabContext = createContext({
  selectedValue: '',
  setSelectedValue: (
    event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>,
  ): void => {
    throw new Error('No Tab provider');
  },
  values: [],
});
export default CodeTabContext;
