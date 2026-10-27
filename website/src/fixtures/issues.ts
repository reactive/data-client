import { RestEndpoint } from '@data-client/rest';

const user = (login: string, img: number) => ({
  login,
  avatar_url: `https://i.pravatar.cc/64?img=${img}`,
});
const users = {
  mayachen: user('mayachen', 5),
  leofischer: user('leofischer', 12),
  amaowusu: user('amaowusu', 45),
  ravikumar: user('ravikumar', 33),
  hanasato: user('hanasato', 47),
  eliasberg: user('eliasberg', 68),
  sofiareyes: user('sofiareyes', 32),
};

// What GitHub's issue search answers, in its shape: newest first;
// "suspense" fills the five rows, "suspense fallback" three
const issues = [
  {
    id: 31842007,
    number: 31842,
    title: 'Suspense fallback flashes on fast connections',
    user: users.mayachen,
  },
  {
    id: 31807007,
    number: 31807,
    title: 'useTransition stays pending after the component unmounts',
    user: users.leofischer,
  },
  {
    id: 31790007,
    number: 31790,
    title: 'Hydration mismatch for dates rendered on the server',
    user: users.amaowusu,
  },
  {
    id: 31766007,
    number: 31766,
    title: 'Suspense boundary resets scroll position when it resolves',
    user: users.ravikumar,
  },
  {
    id: 31751007,
    number: 31751,
    title: 'useEffect cleanup runs twice in Strict Mode',
    user: users.hanasato,
  },
  {
    id: 31733007,
    number: 31733,
    title: 'Nested Suspense boundaries reveal out of order',
    user: users.eliasberg,
  },
  {
    id: 31728007,
    number: 31728,
    title: 'Suspense fallback is skipped during hydration',
    user: users.sofiareyes,
  },
  {
    id: 31720007,
    number: 31720,
    title: "useDeferredValue doesn't defer the first render",
    user: users.sofiareyes,
  },
  {
    id: 31704007,
    number: 31704,
    title: 'Hydration error when a browser extension edits the DOM',
    user: users.mayachen,
  },
  {
    id: 31689007,
    number: 31689,
    title: 'useId differs between server and client',
    user: users.leofischer,
  },
  {
    id: 31671007,
    number: 31671,
    title: 'Suspense fallback never shows inside a transition',
    user: users.amaowusu,
  },
  {
    id: 31663007,
    number: 31663,
    title: 'Lazy component inside Suspense loads twice',
    user: users.eliasberg,
  },
  {
    id: 31652007,
    number: 31652,
    title: 'Context update re-renders every consumer',
    user: users.ravikumar,
  },
  {
    id: 31640007,
    number: 31640,
    title: 'useOptimistic reverts before the action resolves',
    user: users.hanasato,
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
      const matches = issues.filter(issue =>
        words.every(word => issue.title.toLowerCase().includes(word)),
      );
      return {
        total_count: matches.length,
        incomplete_results: false,
        items: matches.slice(0, 5),
      };
    },
    delay: 300,
  },
];
