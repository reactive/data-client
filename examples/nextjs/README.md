This is a [Reactive Data Client](https://dataclient.io/) project integrating [Next.js](https://nextjs.org/) Server Side Rendering.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Verifying the streamed store

The store is streamed to the browser with the HTML. `app/[userId]/page.tsx` waits 50ms before
rendering its Client Component so you can see data fetched after the shell still arrive first:

```bash
npm run build && npm run start &
curl --no-buffer -s http://localhost:3000/1 | grep -o 'data-client-data\|__DATA_CLIENT_DELTAS__\|delectus aut autem' | uniq
```

The baseline (`data-client-data`) and a delta script (`__DATA_CLIENT_DELTAS__`) are printed before
the first todo title, and the browser makes no requests for data already on the page.

To try a local checkout of `@data-client/react`, run `yarn workspace @data-client/react pack` in the
repository root and point this app's `package.json` at the resulting tarball.

## Stackblitz

[Preview this demo in your browser](https://stackblitz.com/github/reactive/data-client/tree/master/examples/nextjs?file=components%2Ftodo%2FTodoList.tsx)

## Learn More

To learn more about running Data Client with Next.js, take a look at the following resources:

- [NextJS + Reactive Data Client guide](https://dataclient.io/docs/guides/ssr#nextjs)
- [Data Client Resources](https://dataclient.io/docs/getting-started/resource) - definining TypeSafe APIs.
- [Data Dependencies](https://dataclient.io/docs/getting-started/data-dependency) - fetch & rendering data in ReactJS components.
- [Reactive Mutations](https://dataclient.io/docs/getting-started/mutations) - building interactive data driven applications.
