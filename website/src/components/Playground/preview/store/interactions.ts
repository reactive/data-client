import { groupEntriesOf, groupOf, type ActionGroup } from './actionGroups';
import type { LogEntry } from './actionLog';
import type { ManagerStage } from './attribution';
import type { CallerEvent } from './fetchCause';

/** What started a run of actions: a person's event, components rendering
 * (their hooks fetching), a manager, or the app with nothing more to say */
export type Interaction =
  | { readonly kind: 'event'; readonly event: CallerEvent }
  | { readonly kind: 'render'; readonly components: readonly string[] }
  | { readonly kind: 'manager'; readonly stage: ManagerStage }
  | { readonly kind: 'app' };

/** Rows under the interaction that started them, oldest first */
export interface InteractionSection {
  readonly id: string;
  readonly interaction: Interaction;
  /** It came before any other: a render then is the app mounting */
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

/** `rows` (some of `groups`) under the interactions that started them. A
 * row a cause set off (a refetch after an invalidate) goes with its cause's
 * interaction, wherever that is in the list */
export function interactionsOf(
  rows: readonly ActionGroup[],
  groups: readonly ActionGroup[],
): InteractionSection[] {
  const roots = new Map<ActionGroup, Root>();
  const rootOf = (row: ActionGroup, seen: Set<ActionGroup>): Root => {
    let root = roots.get(row);
    if (!root) {
      seen.add(row);
      const sent = sentEntry(row);
      const cause =
        sent?.causedBy === undefined ?
          undefined
        : groupOf(groups, sent.causedBy);
      root = cause && !seen.has(cause) ? rootOf(cause, seen) : ownRoot(sent);
      roots.set(row, root);
    }
    return root;
  };

  const sections: {
    id: string;
    interaction: Interaction;
    first: boolean;
    rows: ActionGroup[];
    components: Set<string>;
  }[] = [];
  const byId = new Map<string, (typeof sections)[number]>();
  let last: (typeof sections)[number] | undefined;
  for (const row of rows) {
    const root = rootOf(row, new Set());
    const id =
      !root.joins ? root.id
      : last?.id.startsWith(`${root.id}#`) ? last.id
      : `${root.id}#${sections.length}`;
    let section = byId.get(id);
    if (!section) {
      section = {
        id,
        interaction: root.interaction,
        first: !sections.length,
        rows: [],
        components: new Set(),
      };
      sections.push(section);
      byId.set(id, section);
    }
    section.rows.push(row);
    if (root.interaction.kind === 'render')
      for (const entry of groupEntriesOf(row))
        if (entry.caller?.component)
          section.components.add(entry.caller.component);
    last = section;
  }
  return sections.map(({ components, ...section }) =>
    section.interaction.kind === 'render' ?
      {
        ...section,
        interaction: { kind: 'render', components: [...components] },
      }
    : section,
  );
}

/** The action of `row` that says who sent it: one the log knows a reason
 * or caller for, else its first */
function sentEntry(row: ActionGroup): LogEntry | undefined {
  const entries = groupEntriesOf(row);
  return entries.find(e => e.reason || e.caller) ?? entries[0];
}

const APP: Root = { id: 'app', interaction: { kind: 'app' }, joins: true };

function ownRoot(entry: LogEntry | undefined): Root {
  if (!entry) return APP;
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
  if (caller?.hook)
    return {
      id: 'render',
      interaction: { kind: 'render', components: [] },
      joins: true,
    };
  return APP;
}
