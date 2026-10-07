import { createContext, useContext } from 'react';

import type { StoreModel } from './model';

/** Rows of one table (all, or just `pks`), or rows of any kind by id */
export type ListView =
  | {
      readonly kind: 'list';
      readonly label: string;
      readonly table: string;
      readonly pks?: readonly string[];
    }
  | {
      readonly kind: 'list';
      readonly label: string;
      readonly ids: readonly string[];
    };

/** One level of the table view's navigation stack */
export type View =
  | { readonly kind: 'root' }
  | ListView
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

/** Where `el` sits in `scroller`'s scrolled content, in px */
export const offsetIn = (scroller: HTMLElement, el: Element) =>
  el.getBoundingClientRect().top -
  scroller.getBoundingClientRect().top +
  scroller.scrollTop;
