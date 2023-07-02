import { CacheProvider } from '@data-client/react';
import React from 'react';

// Default implementation, that you can customize
export default function Root({ children }) {
  return <CacheProvider>{children}</CacheProvider>;
}
