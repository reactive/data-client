import { createContext } from 'react';

/** Where the router (./router.tsx) renders its controls: a slot in the
 * preview's header, so they take no room from the demo. Kept apart from the
 * router, since ../index.tsx renders the header in every page chunk that
 * embeds a Playground */
export const RouterControlsSlot = createContext<HTMLElement | null>(null);
