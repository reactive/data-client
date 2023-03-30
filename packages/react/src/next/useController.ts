// Server Side Component compatibility (specifying this cannot be used as such)
// context does not work in server components
// https://beta.nextjs.org/docs/rendering/server-and-client-components#third-party-packages
'use client';
import { Controller } from '@rest-hooks/core/next';
import { useContext, useMemo } from 'react';

import { ControllerContext } from '../context.js';

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/useController
 */
export default function useController(): Controller {
  const base = useContext(ControllerContext);
  return useMemo(() => {
    return new Controller(base);
  }, [base]);
}
