This is a [Reactive Data Client](https://dataclient.io/) project integrating [Next.js](https://nextjs.org/) Server Side Rendering.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Verifying the streamed store

The store hydrates incrementally: an inert baseline, then a `StateDelta` per committed server
revision. A late island hydrates at **its** generation when that piece is already folded.
Flight may start a Client Component before the HTML delta; script-before-HTML is not a
zero-refetch guarantee. See the
[SSR guide](https://dataclient.io/docs/guides/ssr#streamed-hydration) for what ships.

`app/[userId]/page.tsx` waits 50ms before rendering its Client Component. The curl below is a
**wire check** (baseline and a delta appear in the HTML stream), not the hydration contract:

```bash
npm run build && npm run start &
curl --no-buffer -s http://localhost:3000/1 | grep -o 'data-client-data\|__DATA_CLIENT_DELTAS__\|delectus aut autem' | uniq
```

The baseline (`data-client-data`) and a delta script (`__DATA_CLIENT_DELTAS__`) are printed before
the first todo title. Script-before-Fizz-HTML does not by itself mean zero client requests.

To try a local checkout of `@data-client/react`, run `yarn workspace @data-client/react pack` in the
repository root and point this app's `package.json` at the resulting tarball.

## Stackblitz

[Preview this demo in your browser](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx)

## Learn More

To learn more about running Data Client with Next.js, take a look at the following resources:

- [NextJS + Reactive Data Client guide](https://dataclient.io/docs/guides/ssr#nextjs)
- [Incremental streamed hydration](https://dataclient.io/docs/guides/ssr#streamed-hydration)
- [Data Client Resources](https://dataclient.io/docs/getting-started/resource) - definining TypeSafe APIs.
- [Data Dependencies](https://dataclient.io/docs/getting-started/data-dependency) - fetch & rendering data in ReactJS components.
- [Reactive Mutations](https://dataclient.io/docs/getting-started/mutations) - building interactive data driven applications.
