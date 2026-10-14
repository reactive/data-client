// Jest stand-in for @theme/CodeBlock: the code, unhighlighted
import React from 'react';

export default function CodeBlock({
  children,
  className,
  language,
}: {
  children: string;
  className?: string;
  language?: string;
}) {
  return (
    <pre className={className} data-language={language}>
      <code>{children}</code>
    </pre>
  );
}
