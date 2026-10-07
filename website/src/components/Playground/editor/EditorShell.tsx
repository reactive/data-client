import { usePrismTheme } from '@docusaurus/theme-common';
import React from 'react';
import { LiveProvider } from 'react-live';

export default function EditorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = usePrismTheme();
  return (
    <LiveProvider theme={theme} enableTypeScript>
      {children}
    </LiveProvider>
  );
}
