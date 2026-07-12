import React from 'react';
import { LiveProvider } from 'react-live';

import MonacoPreloads from './MonacoPreloads';
import { useReactLiveTheme } from './useReactLiveTheme';

export default function EditorShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useReactLiveTheme();
  return (
    <>
      <LiveProvider theme={theme} enableTypeScript>
        {children}
      </LiveProvider>
      <MonacoPreloads />
    </>
  );
}
