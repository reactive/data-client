import { createContext, useContext } from 'react';

import type { StoreModel } from './model';

/** One level of the table view's navigation stack */
export type View =
  | { readonly kind: 'root' }
  /** Rows of a whole table, or just `ids` (entity or endpoint row ids) */
  | {
      readonly kind: 'list';
      readonly label: string;
      readonly table?: string;
      readonly ids?: readonly string[];
    }
  | { readonly kind: 'record'; readonly id: string };

export interface Nav {
  readonly model: StoreModel;
  /** Panel width in px, to fit columns and chips */
  readonly width: number;
  readonly push: (view: View) => void;
}

/** Set by the table view only; the tree view expands in place instead */
export const NavContext = createContext<Nav | null>(null);
export const useNav = () => useContext(NavContext);
