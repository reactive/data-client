import { createContext } from 'react';

/** True anywhere under content not shown yet: a tab that is not selected
 * (theme/TabItem, PlaygroundTabs included) or a `<details>` not yet opened
 * (theme/Details), nested ones included. Playgrounds there run hidden
 * (Playground `hidden`); code there is plain text until it shows. */
export const PlaygroundHiddenContext = createContext(false);
