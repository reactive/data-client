import React, { createContext, useContext } from 'react';

/** True anywhere under content not shown yet: a tab that is not selected
 * (theme/TabItem, PlaygroundTabs included) or a `<details>` not yet opened
 * (theme/Details), nested ones included. Playgrounds there run hidden
 * (Playground `hidden`); code there is plain text until it shows. */
export const HiddenContext = createContext(false);

/** Marks its children hidden while `hidden`, or while an ancestor is */
export function HiddenProvider({
  hidden,
  children,
}: {
  hidden: boolean;
  children: React.ReactNode;
}) {
  const inherited = useContext(HiddenContext);
  return (
    <HiddenContext.Provider value={inherited || hidden}>
      {children}
    </HiddenContext.Provider>
  );
}
