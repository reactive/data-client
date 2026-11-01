'use client';
import { AsyncBoundary } from '@data-client/react';

import Profile from '../../../src/pages/Profile';

export default function Page() {
  return (
    <AsyncBoundary>
      <Profile />
    </AsyncBoundary>
  );
}
