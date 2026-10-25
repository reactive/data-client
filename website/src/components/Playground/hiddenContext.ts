import { createContext } from 'react';

/** True anywhere under a PlaygroundTabs tab that is not selected, nested tab
 * groups included: playgrounds there run hidden (no live preview, static code
 * until first shown) */
export const PlaygroundHiddenContext = createContext(false);
