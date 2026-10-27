import { RestEndpoint } from '@data-client/rest';

// What GitHub's issue search answers, in its shape: newest first;
// "suspense" fills the five rows, "suspense fallback" three
const issues = [
  {
    id: 31842007,
    number: 31842,
    title: 'Suspense fallback flashes on fast connections',
    user: { login: 'mayachen', avatar_url: 'https://i.pravatar.cc/64?img=5' },
  },
  {
    id: 31807007,
    number: 31807,
    title: 'useTransition stays pending after the component unmounts',
    user: {
      login: 'leofischer',
      avatar_url: 'https://i.pravatar.cc/64?img=12',
    },
  },
  {
    id: 31790007,
    number: 31790,
    title: 'Hydration mismatch for dates rendered on the server',
    user: { login: 'amaowusu', avatar_url: 'https://i.pravatar.cc/64?img=45' },
  },
  {
    id: 31766007,
    number: 31766,
    title: 'Suspense boundary resets scroll position when it resolves',
    user: { login: 'ravikumar', avatar_url: 'https://i.pravatar.cc/64?img=33' },
  },
  {
    id: 31751007,
    number: 31751,
    title: 'useEffect cleanup runs twice in Strict Mode',
    user: { login: 'hanasato', avatar_url: 'https://i.pravatar.cc/64?img=47' },
  },
  {
    id: 31733007,
    number: 31733,
    title: 'Nested Suspense boundaries reveal out of order',
    user: { login: 'eliasberg', avatar_url: 'https://i.pravatar.cc/64?img=68' },
  },
  {
    id: 31728007,
    number: 31728,
    title: 'Suspense fallback is skipped during hydration',
    user: {
      login: 'sofiareyes',
      avatar_url: 'https://i.pravatar.cc/64?img=32',
    },
  },
  {
    id: 31720007,
    number: 31720,
    title: "useDeferredValue doesn't defer the first render",
    user: {
      login: 'sofiareyes',
      avatar_url: 'https://i.pravatar.cc/64?img=32',
    },
  },
  {
    id: 31704007,
    number: 31704,
    title: 'Hydration error when a browser extension edits the DOM',
    user: { login: 'mayachen', avatar_url: 'https://i.pravatar.cc/64?img=5' },
  },
  {
    id: 31689007,
    number: 31689,
    title: 'useId differs between server and client',
    user: {
      login: 'leofischer',
      avatar_url: 'https://i.pravatar.cc/64?img=12',
    },
  },
  {
    id: 31671007,
    number: 31671,
    title: 'Suspense fallback never shows inside a transition',
    user: { login: 'amaowusu', avatar_url: 'https://i.pravatar.cc/64?img=45' },
  },
  {
    id: 31663007,
    number: 31663,
    title: 'Lazy component inside Suspense loads twice',
    user: { login: 'eliasberg', avatar_url: 'https://i.pravatar.cc/64?img=68' },
  },
  {
    id: 31652007,
    number: 31652,
    title: 'Context update re-renders every consumer',
    user: { login: 'ravikumar', avatar_url: 'https://i.pravatar.cc/64?img=33' },
  },
  {
    id: 31640007,
    number: 31640,
    title: 'useOptimistic reverts before the action resolves',
    user: { login: 'hanasato', avatar_url: 'https://i.pravatar.cc/64?img=47' },
  },
];

/** The issues whose title holds every word of `q` (its qualifiers, like
 * `repo:`, aside), five at most */
export const issueFixtures = [
  {
    endpoint: new RestEndpoint({
      urlPrefix: 'https://api.github.com',
      path: '/search/issues',
      searchParams: {} as { q: string },
    }),
    response({ q }: { q: string }) {
      const words = q
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word && !word.includes(':'));
      const items = issues
        .filter(issue =>
          words.every(word => issue.title.toLowerCase().includes(word)),
        )
        .slice(0, 5);
      return { total_count: items.length, incomplete_results: false, items };
    },
    delay: 300,
  },
];
