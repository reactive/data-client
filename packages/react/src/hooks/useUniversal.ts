import React, { useContext } from 'react';

const useUniversal: <T>(context: React.Context<T>) => T =
  /* istanbul ignore if */
  'use' in React ? /* istanbul ignore next */ (React.use as any) : useContext;
export default useUniversal;
