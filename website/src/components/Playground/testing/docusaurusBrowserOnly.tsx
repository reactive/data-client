// Jest stand-in for @docusaurus/BrowserOnly: jsdom is a browser, so it renders
import type { ReactNode } from 'react';

export default function BrowserOnly({
  children,
}: {
  children: () => ReactNode;
  fallback?: ReactNode;
}) {
  return <>{children()}</>;
}
