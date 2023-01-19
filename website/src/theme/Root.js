import { CacheProvider } from '@rest-hooks/react';
import React from 'react';

// Default implementation, that you can customize
export default function Root({ children }) {
  return <CacheProvider>{children}</CacheProvider>;
}
