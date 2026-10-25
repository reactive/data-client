import { createContext } from 'react';

/** True inside a tab group's unselected tab (PlaygroundTabs): its playgrounds
 * run hidden (no live preview, static code until first shown) */
export const PlaygroundHiddenContext = createContext(false);
