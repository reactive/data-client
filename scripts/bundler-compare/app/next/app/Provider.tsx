'use client';
import { DataProvider } from '@data-client/react/nextjs';

export default function Provider({ children }: { children: React.ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}
