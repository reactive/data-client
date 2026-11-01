'use client';
import { AsyncBoundary } from '@data-client/react';

import Todos from '../../../src/pages/Todos';

export default function Client() {
  return (
    <AsyncBoundary>
      <Todos />
    </AsyncBoundary>
  );
}
