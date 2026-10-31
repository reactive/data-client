import { groupEntriesOf, type ActionGroup } from './actionGroups';
import { rootEntry, type LogEntry } from './actionLog';
import type { ManagerStage } from './attribution';
import type { CallerEvent } from './fetchCause';

/** What started a run of actions: a person's event, components rendering
 * (their hooks fetching), a manager, or the app with nothing more to say */
export type Interaction =
  | { readonly kind: 'event'; readonly event: CallerEvent }
  | {
      readonly kind: 'render';
      readonly components: readonly string[];
      /** The router page they render in, once it navigated */
      readonly path?: string;
    }
  | { readonly kind: 'manager'; readonly stage: ManagerStage }
  | { readonly kind: 'app' };

/** Rows under the interaction that started them, oldest first */
export interface InteractionSection {
  readonly id: string;
  readonly interaction: Interaction;
  /** It came before any other, or any other of its page: a render then is
   * the app, or the page navigated to, mounting */
  readonly first: boolean;
  readonly rows: readonly ActionGroup[];
}

/** What a row traces back to. `joins`: renders, a manager's actions and the
 * app's share the section before them when it is theirs too */
interface Root {
  readonly id: string;
  readonly interaction: Interaction;
  readonly joins: boolean;
}

/** `rows` under the interactions that started them. A row another action
 * started (a refetch after an invalidate, see `LogEntry.root`) goes with
 * that action's, wherever it is in the list */
export function interactionsOf(
  rows: readonly ActionGroup[],
  entries: readonly LogEntry[],
): InteractionSection[] {
  type Section = InteractionSection & { rows: ActionGroup[] };
  const sections: Section[] = [];
  const byId = new Map<string, Section>();
  let last: Section | undefined;
  /** A joining root's sections are `<root id>#<n>` */
  const isOf = (section: Section | undefined, root: Root) =>
    !!section?.id.startsWith(`${root.id}#`);
  const sectionFor = (root: Root) => {
    const id =
      !root.joins ? root.id
      : isOf(last, root) ? last!.id
      : `${root.id}#${sections.length}`;
    let section = byId.get(id);
    if (!section) {
      section = {
        id,
        interaction: root.interaction,
        first:
          !sections.length ||
          // its page's first, as one page's sections share a root
          (root.interaction.kind === 'render' &&
            root.interaction.path !== undefined &&
            !sections.some(section => isOf(section, root))),
        rows: [],
      };
      sections.push(section);
      byId.set(id, section);
    }
    return section;
  };

  /** By the action that started their rows */
  const byRoot = new Map<number, Section>();
  for (const row of rows) {
    const root = rootEntry(entries, groupEntriesOf(row)[0]);
    let section = byRoot.get(root.seq);
    if (!section) {
      section = sectionFor(ownRoot(root));
      byRoot.set(root.seq, section);
      // the next row may join only a section that ends the list so far
      last = section;
    }
    section.rows.push(row);
  }
  return sections.map(section =>
    section.interaction.kind === 'render' ?
      {
        ...section,
        interaction: {
          ...section.interaction,
          components: componentsOf(section.rows),
        },
      }
    : section,
  );
}

/** The components whose hooks sent `rows`, first seen first */
const componentsOf = (rows: readonly ActionGroup[]) => [
  ...new Set(
    rows
      .flatMap(groupEntriesOf)
      .flatMap(({ caller }) => caller?.component ?? []),
  ),
];

/** The user event that started `entry`, if one did */
export const rootEvent = (entries: readonly LogEntry[], entry: LogEntry) =>
  rootEntry(entries, entry).caller?.event;

const APP: Root = { id: 'app', interaction: { kind: 'app' }, joins: true };

function ownRoot(entry: LogEntry): Root {
  const { caller, origin } = entry;
  if (caller?.event) {
    const { event } = caller;
    // one event, however many actions its handler sent
    return {
      id: `event ${event.type} ${event.at ?? entry.seq}`,
      interaction: { kind: 'event', event },
      joins: false,
    };
  }
  if (origin)
    return {
      id: `manager ${origin.id}`,
      interaction: { kind: 'manager', stage: origin },
      joins: true,
    };
  if (caller?.page) {
    const { path, visit } = caller.page;
    // a page navigated to mounts apart from the one before it
    return {
      id: `page ${visit}`,
      interaction: { kind: 'render', components: [], path },
      joins: true,
    };
  }
  if (caller?.hook)
    return {
      id: 'render',
      interaction: { kind: 'render', components: [] },
      joins: true,
    };
  return APP;
}
