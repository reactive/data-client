import { RestEndpoint } from '@data-client/rest';

// newest first; "suspense" fills the five rows, "suspense fallback" three
const issues = [
  {
    id: 31842,
    title: 'Suspense fallback flashes on fast connections',
    author: 'Maya Chen',
    comments: 14,
  },
  {
    id: 31807,
    title: 'useTransition stays pending after the component unmounts',
    author: 'Leo Fischer',
    comments: 6,
  },
  {
    id: 31790,
    title: 'Hydration mismatch for dates rendered on the server',
    author: 'Ama Owusu',
    comments: 23,
  },
  {
    id: 31766,
    title: 'Suspense boundary resets scroll position when it resolves',
    author: 'Ravi Kumar',
    comments: 9,
  },
  {
    id: 31751,
    title: 'useEffect cleanup runs twice in Strict Mode',
    author: 'Hana Sato',
    comments: 31,
  },
  {
    id: 31733,
    title: 'Nested Suspense boundaries reveal out of order',
    author: 'Elias Berg',
    comments: 4,
  },
  {
    id: 31728,
    title: 'Suspense fallback is skipped during hydration',
    author: 'Sofia Reyes',
    comments: 7,
  },
  {
    id: 31720,
    title: "useDeferredValue doesn't defer the first render",
    author: 'Sofia Reyes',
    comments: 12,
  },
  {
    id: 31704,
    title: 'Hydration error when a browser extension edits the DOM',
    author: 'Maya Chen',
    comments: 47,
  },
  {
    id: 31689,
    title: 'useId differs between server and client',
    author: 'Leo Fischer',
    comments: 8,
  },
  {
    id: 31671,
    title: 'Suspense fallback never shows inside a transition',
    author: 'Ama Owusu',
    comments: 17,
  },
  {
    id: 31663,
    title: 'Lazy component inside Suspense loads twice',
    author: 'Elias Berg',
    comments: 2,
  },
  {
    id: 31652,
    title: 'Context update re-renders every consumer',
    author: 'Ravi Kumar',
    comments: 5,
  },
  {
    id: 31640,
    title: 'useOptimistic reverts before the action resolves',
    author: 'Hana Sato',
    comments: 11,
  },
];

/** A search: the issues whose title holds every word of `q`, five at most */
export const issueFixtures = [
  {
    endpoint: new RestEndpoint({
      path: '/issues',
      searchParams: {} as { q: string },
    }),
    response({ q }: { q: string }) {
      const words = q.toLowerCase().split(/\s+/).filter(Boolean);
      return issues
        .filter(issue =>
          words.every(word => issue.title.toLowerCase().includes(word)),
        )
        .slice(0, 5);
    },
    delay: 300,
  },
];
