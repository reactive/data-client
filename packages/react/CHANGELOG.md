# @data-client/react

## 0.12.5

### Patch Changes

- [`e4d5f01`](https://github.com/reactive/data-client/commit/e4d5f019f7c3817fb740094244e8ce17ccd5452d) Thanks [@ntucker](https://github.com/ntucker)! - [DevToolsManager](https://dataclient.io/docs/api/DevToolsManager) uses [maxAge](https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/Arguments.md#maxage) to set buffer size

- [`30208fb`](https://github.com/reactive/data-client/commit/30208fb065cc071643f338c8e6333449e2cc0340) Thanks [@ntucker](https://github.com/ntucker)! - Only show devtools button when DevToolsManager is used

  Previously, one could use custom managers list and it
  would still show the devtools button. This was confusing
  as opening it would show no instance for Data Client.

- [`c3481ad`](https://github.com/reactive/data-client/commit/c3481ad578c77a6dc73f45f1afcec353ba032534) Thanks [@ntucker](https://github.com/ntucker)! - Fix DevToolsManager() config parameter correctly sets devtools config

- Updated dependencies [[`e4d5f01`](https://github.com/reactive/data-client/commit/e4d5f019f7c3817fb740094244e8ce17ccd5452d), [`c3481ad`](https://github.com/reactive/data-client/commit/c3481ad578c77a6dc73f45f1afcec353ba032534)]:
  - @data-client/core@0.12.5

## 0.12.3

### Patch Changes

- [`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d) Thanks [@ntucker](https://github.com/ntucker)! - Add funding package.json field

- Updated dependencies [[`00d4205`](https://github.com/reactive/data-client/commit/00d4205f03562cfe4acd18215718e23ae5466b8d), [`8a8634c`](https://github.com/reactive/data-client/commit/8a8634c7a263cf99e9ce426b2c9b92fd2a12a259)]:
  - @data-client/use-enhanced-reducer@0.1.7
  - @data-client/core@0.12.3

## 0.12.1

### Patch Changes

- [#3043](https://github.com/reactive/data-client/pull/3043) [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c) Thanks [@ntucker](https://github.com/ntucker)! - Improve [controller](https://dataclient.io/docs/api/Controller) type matching for its methods

- [#3043](https://github.com/reactive/data-client/pull/3043) [`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c) Thanks [@ntucker](https://github.com/ntucker)! - Improve [useFetch()](https://dataclient.io/docs/api/useFetch) argtype matching similar to [useSuspense()](https://dataclient.io/docs/api/useSuspense)

- [`6e9d36b`](https://github.com/reactive/data-client/commit/6e9d36b6cb287763c0fcc3f07d9f2ef0df619d12) Thanks [@ntucker](https://github.com/ntucker)! - Fix useDLE return loading and error when args can be null

- Updated dependencies [[`5b64cbf`](https://github.com/reactive/data-client/commit/5b64cbf3126c404b70853960a4bdedc268e3328c)]:
  - @data-client/core@0.12.1

## 0.11.5

### Patch Changes

- [#3033](https://github.com/reactive/data-client/pull/3033) [`2152b41`](https://github.com/reactive/data-client/commit/2152b41afc56027175bd36e7ef89c433a2e5e025) Thanks [@ntucker](https://github.com/ntucker)! - Environments without RequestIdleCallback will call immediately

- Updated dependencies [[`2152b41`](https://github.com/reactive/data-client/commit/2152b41afc56027175bd36e7ef89c433a2e5e025)]:
  - @data-client/core@0.11.5

## 0.11.4

### Patch Changes

- [#3020](https://github.com/reactive/data-client/pull/3020) [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d) Thanks [@ntucker](https://github.com/ntucker)! - Hooks arg-typechecking accuracy improved

  For example string literals now work:

  ```ts
  const getThing = new Endpoint(
    (args: { postId: string | number; sortBy?: "votes" | "recent" }) =>
      Promise.resolve({ a: 5, ...args }),
    { schema: MyEntity },
  );

  const myThing = useSuspense(getThing, {
    postId: "5",
    sortBy: "votes",
  });
  ```

- [#3023](https://github.com/reactive/data-client/pull/3023) [`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5) Thanks [@renovate](https://github.com/apps/renovate)! - Compatibility with React 19 by removing defaultProps

- Updated dependencies [[`9dea825`](https://github.com/reactive/data-client/commit/9dea825cc979eeb1558f1e686cbbaacee6d137c5), [`dcb6b2f`](https://github.com/reactive/data-client/commit/dcb6b2fd4a5015242f43edc155352da6789cdb5d)]:
  - @data-client/use-enhanced-reducer@0.1.6
  - @data-client/core@0.11.4

## 0.11.2

### Patch Changes

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - ErrorBoundary listens to all errors

  This means it may catch errors that were previously passing thorugh

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - ErrorBoundary default error fallback supports react native

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - Add listen prop to ErrorBoundary and AsyncBoundary

  ```tsx
  <AsyncBoundary listen={history.listen}>
    <MatchedRoute index={0} />
  </AsyncBoundary>
  ```

- [#3010](https://github.com/reactive/data-client/pull/3010) [`c906392`](https://github.com/reactive/data-client/commit/c9063927c7437a387f426a14c4b244cc1caa49c2) Thanks [@ntucker](https://github.com/ntucker)! - Add resetErrorBoundary sent to errorComponent

  ```tsx
  function ErrorComponent({
    error,
    className,
    resetErrorBoundary,
  }: {
    error: Error;
    resetErrorBoundary: () => void;
    className?: string;
  }) {
    return (
      <pre role="alert" className={className}>
        {error.message} <button onClick={resetErrorBoundary}>Reset</button>
      </pre>
    );
  }
  ```

## 0.11.0

[Release notes and migration guide](https://dataclient.io/blog/2024/04/08/v0.11-queries-querable-usequery)

### Minor Changes

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: new AbortOptimistic() -> [snapshot.abort](https://dataclient/docs/api/Snapshot#abort)

  #### Before

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw new AbortOptimistic();
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

  #### After

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw snapshot.abort;
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

- [#2963](https://github.com/reactive/data-client/pull/2963) [`7580500`](https://github.com/reactive/data-client/commit/7580500cecb2c4baa093f4db7b951af4840a0967) Thanks [@ntucker](https://github.com/ntucker)! - useCache() accepts Endpoints with sideEffects

- [#2977](https://github.com/reactive/data-client/pull/2977) [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Schema.infer -> Schema.queryKey

  ```ts title="Before"
  class MyEntity extends Entity {
    // highlight-next-line
    static infer(
      args: readonly any[],
      indexes: NormalizedIndex,
      recurse: any,
      entities: any,
    ): any {
      if (SILLYCONDITION) return undefined;
      return super.infer(args, indexes, recurse, entities);
    }
  }
  ```

  ```ts title="After"
  class MyEntity extends Entity {
    // highlight-next-line
    static queryKey(
      args: readonly any[],
      queryKey: (...args: any) => any,
      getEntity: GetEntity,
      getIndex: GetIndex,
    ): any {
      if (SILLYCONDITION) return undefined;
      return super.queryKey(args, queryKey, getEntity, getIndex);
    }
  }
  ```

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Add [useQuery()](https://dataclient.io/docs/api/useQuery) to render [Querable Schemas](https://dataclient.io/docs/api/useQuery#queryable)

  ```ts
  class User extends Entity {
    username = "";
    id = "";
    groupId = "";
    pk() {
      return this.id;
    }
    static index = ["username" as const];
  }

  const bob = useQuery(User, { username: "bob" });
  ```

  ```ts
  const getUserCount = new schema.Query(
    new schema.All(User),
    (entries, { isAdmin } = {}) => {
      if (isAdmin !== undefined)
        return entries.filter((user) => user.isAdmin === isAdmin).length;
      return entries.length;
    },
  );

  const userCount = useQuery(getUserCount);
  const adminCount = useQuery(getUserCount, { isAdmin: true });
  ```

  ```ts
  const UserCollection = new schema.Collection([User], {
    argsKey: (urlParams: { groupId?: string }) => ({
      ...urlParams,
    }),
  });

  const usersInGroup = useQuery(UserCollection, { groupId: "5" });
  ```

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Add [controller.get](https://dataclient.io/docs/api/Controller#get) / [snapshot.get](https://dataclient.io/docs/api/Snapshot#get) to directly read [Querable Schemas](https://dataclient.io/docs/api/useQuery#queryable)

  #### Before

  ```tsx
  export const PostResource = createResource({
    path: "/posts/:id",
    schema: Post,
  }).extend((Base) => ({
    vote: new RestEndpoint({
      path: "/posts/:id/vote",
      method: "POST",
      body: undefined,
      schema: Post,
      getOptimisticResponse(snapshot, { id }) {
        const { data } = snapshot.getResponse(Base.get, { id });
        if (!data) throw new AbortOptimistic();
        return {
          id,
          votes: data.votes + 1,
        };
      },
    }),
  }));
  ```

  #### After

  ```tsx
  export const PostResource = createResource({
    path: "/posts/:id",
    schema: Post,
  }).extend("vote", {
    path: "/posts/:id/vote",
    method: "POST",
    body: undefined,
    schema: Post,
    getOptimisticResponse(snapshot, { id }) {
      const post = snapshot.get(Post, { id });
      if (!post) throw new AbortOptimistic();
      return {
        id,
        votes: post.votes + 1,
      };
    },
  });
  ```

- [#2957](https://github.com/reactive/data-client/pull/2957) [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a) Thanks [@ntucker](https://github.com/ntucker)! - Add [snapshot.abort](https://dataclient.io/docs/api/Snapshot#abort)

  ```ts
  getOptimisticResponse(snapshot, { id }) {
    const { data } = snapshot.getResponse(Base.get, { id });
    if (!data) throw snapshot.abort;
    return {
      id,
      votes: data.votes + 1,
    };
  }
  ```

- [#2997](https://github.com/reactive/data-client/pull/2997) [`8d42ef6`](https://github.com/reactive/data-client/commit/8d42ef6fae10859bcac1812cdbe637c739afaa6d) Thanks [@ntucker](https://github.com/ntucker)! - useDLE() reactive native focus handling

  When using React Navigation, useDLE() will trigger fetches on focus if the data is considered
  stale.

- [#2971](https://github.com/reactive/data-client/pull/2971) [`b738e18`](https://github.com/reactive/data-client/commit/b738e18f7dc2976907198192ed4ec62775e52161) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Internal state.results -> state.endpoints

### Patch Changes

- [`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4) Thanks [@ntucker](https://github.com/ntucker)! - Fix schema.All denormalize INVALID case should also work when class name mangling is performed in production builds

  - `unvisit()` always returns `undefined` with `undefined` as input.
  - `All` returns INVALID from `queryKey()` to invalidate what was previously a special case in `unvisit()` (when there is no table entry for the given entity)

- [`ca79a62`](https://github.com/reactive/data-client/commit/ca79a6266cc6834ee8d8e228b4715513d13185e0) Thanks [@ntucker](https://github.com/ntucker)! - Update description in package.json

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Improve controller.getResponse() type matching

  Uses function overloading to more precisely match argument
  expectations for fetchable Endpoints vs only keyable Endpoints.

- [#2921](https://github.com/reactive/data-client/pull/2921) [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa) Thanks [@ntucker](https://github.com/ntucker)! - Update README

- Updated dependencies [[`2e169b7`](https://github.com/reactive/data-client/commit/2e169b705e4f8e2eea8005291a0e76e9d11764a4), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`ca79a62`](https://github.com/reactive/data-client/commit/ca79a6266cc6834ee8d8e228b4715513d13185e0), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`6e55026`](https://github.com/reactive/data-client/commit/6e550260672507592d75c4781dc2563a50e664fa), [`c129a25`](https://github.com/reactive/data-client/commit/c129a2558ecb21b5d9985c13747c555b88c51b3a), [`59a407a`](https://github.com/reactive/data-client/commit/59a407a5bcaa8e5c6a948a85f5c52f106b24c5af), [`b738e18`](https://github.com/reactive/data-client/commit/b738e18f7dc2976907198192ed4ec62775e52161)]:
  - @data-client/core@0.11.0

## 0.10.0

### Minor Changes

- [#2912](https://github.com/reactive/data-client/pull/2912) [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGE: `null` inputs are no longer filtered from Array or Object

  - `[]` and [schema.Array](https://dataclient.io/rest/api/Array) now behave in the same manner.
  - `null` values are now consistently handled everywhere (being retained).
    - These were already being retained in [nested Entities](https://dataclient.io/rest/guides/relational-data#nesting)
  - `undefined` is still filtered out.

### Patch Changes

- [`053e823`](https://github.com/reactive/data-client/commit/053e82377bd29f200cd7dfbc700da7a3ad7fa8d7) Thanks [@ntucker](https://github.com/ntucker)! - Update NextJS Demo link

- [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae) Thanks [@ntucker](https://github.com/ntucker)! - Update README with API links

- Updated dependencies [[`4e6a39e`](https://github.com/reactive/data-client/commit/4e6a39ea2bfdb1390051f12781e899488609e1a8), [`922be79`](https://github.com/reactive/data-client/commit/922be79169a3eeea8e336eee519c165431ead474), [`69834b5`](https://github.com/reactive/data-client/commit/69834b50c6d2b33f46d7c63cabdc0744abf160ae), [`056737e`](https://github.com/reactive/data-client/commit/056737ec98a2f4406b0239bcb86a5668cbd0ad92)]:
  - @data-client/core@0.10.0
  - @data-client/use-enhanced-reducer@0.1.5

## 0.9.9

### Patch Changes

- [`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8) Thanks [@ntucker](https://github.com/ntucker)! - docs: Add keywords to package

- Updated dependencies [[`e3314a7`](https://github.com/reactive/data-client/commit/e3314a7ca64919c093b838048caaa8b7530fa7c8)]:
  - @data-client/use-enhanced-reducer@0.1.4

## 0.9.7

### Patch Changes

- [`6c6678bd9d`](https://github.com/reactive/data-client/commit/6c6678bd9d0051c3bf1996c064457ca6f2389c62) Thanks [@ntucker](https://github.com/ntucker)! - docs: README uses svg version of logo

- Updated dependencies [[`6c6678bd9d`](https://github.com/reactive/data-client/commit/6c6678bd9d0051c3bf1996c064457ca6f2389c62)]:
  - @data-client/core@0.9.7

## 0.9.6

### Patch Changes

- [#2825](https://github.com/reactive/data-client/pull/2825) [`f5ac286623`](https://github.com/reactive/data-client/commit/f5ac286623a566acf5414a6ac8de18e9b7510ae7) Thanks [@ntucker](https://github.com/ntucker)! - CommonJS build includes NextJS App Directive compatibility

## 0.9.4

### Patch Changes

- [`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles by ensuring dependencies are built in order

- Updated dependencies [[`d1b51af7ac`](https://github.com/reactive/data-client/commit/d1b51af7ac4a8a7c0559f478cc9503be8e61514c)]:
  - @data-client/use-enhanced-reducer@0.1.3
  - @data-client/core@0.9.4

## 0.9.3

### Patch Changes

- [#2818](https://github.com/reactive/data-client/pull/2818) [`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95) Thanks [@ntucker](https://github.com/ntucker)! - Fix unpkg bundles and update names

  - Client packages namespace into RDC
    - @data-client/react - RDC
    - @data-client/core - RDC.Core
    - @data-client/redux - RDC.Redux
  - Definition packages namespace top level
    - @data-client/rest - Rest
    - @data-client/graphql - GraphQL
    - @data-client/img - Img
    - @data-client/endpoint - Endpoint
  - Utility
    - @data-client/normalizr - normalizr
    - @data-client/use-enhanced-reducer - EnhancedReducer

- [`9cafe908c1`](https://github.com/reactive/data-client/commit/9cafe908c1a0f5ed97f246acac37c1365bd4f476) Thanks [@ntucker](https://github.com/ntucker)! - docs: Update logo banner img

- Updated dependencies [[`fc0092883f`](https://github.com/reactive/data-client/commit/fc0092883f5af42a5d270250482b7f0ba9845e95), [`327b94bedc`](https://github.com/reactive/data-client/commit/327b94bedc280e25c1766b3a51cc20078bfa1739)]:
  - @data-client/use-enhanced-reducer@0.1.2
  - @data-client/core@0.9.3

## 0.9.2

### Patch Changes

- [`c9ca31f3f4`](https://github.com/reactive/data-client/commit/c9ca31f3f4f2f6e3174c74172ebc194edbe56bb2) Thanks [@ntucker](https://github.com/ntucker)! - Better track state changes between each action

  Since React 18 batches updates, the real state can
  sometimes update from multiple actions, making it harder
  to debug. When devtools are open, instead of getting
  the real state - track a shadow state that accurately reflects
  changes from each action.

- [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e) Thanks [@ntucker](https://github.com/ntucker)! - Docs: Update repo links to reactive organization

- Updated dependencies [[`c9ca31f3f4`](https://github.com/reactive/data-client/commit/c9ca31f3f4f2f6e3174c74172ebc194edbe56bb2), [`4ea0bc83f6`](https://github.com/reactive/data-client/commit/4ea0bc83f65f49cb2155f6aecdc5f8d1b168fd5e)]:
  - @data-client/core@0.9.2
  - @data-client/use-enhanced-reducer@0.1.1

## 0.9.0

### Minor Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - Replace BackupBoundary with UniversalSuspense + BackupLoading
  BREAKING: Remove BackupBoundary

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: In dev mode add second suspense boundary for devtool button. This will cause hydration mismatch if packages are not the same.

### Patch Changes

- [#2803](https://github.com/reactive/data-client/pull/2803) [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7) Thanks [@ntucker](https://github.com/ntucker)! - Add button to open devtools in development mode

  Can be disabled or location configured using `devButton` [CacheProvider](https://dataclient.io/docs/api/CacheProvider)
  property

  ```tsx
  <CacheProvider devButton={null}>
    <App />
  </CacheProvider>
  ```

  ```tsx
  <CacheProvider devButton="top-right">
    <App />
  </CacheProvider>
  ```

- [`a7da00e82d`](https://github.com/reactive/data-client/commit/a7da00e82d5473f12881b85c9736a79e016ee526) Thanks [@ntucker](https://github.com/ntucker)! - Endpoint properties fully visible in devtool

- [`2d2e94126e`](https://github.com/reactive/data-client/commit/2d2e94126e5962511e250df5d813d056646de41b) Thanks [@ntucker](https://github.com/ntucker)! - DevTools no longer forgets history if not open on page load

- Updated dependencies [[`a7da00e82d`](https://github.com/reactive/data-client/commit/a7da00e82d5473f12881b85c9736a79e016ee526), [`2d2e94126e`](https://github.com/reactive/data-client/commit/2d2e94126e5962511e250df5d813d056646de41b), [`386372ed4d`](https://github.com/reactive/data-client/commit/386372ed4d0b454687847ba2b8eed4369ef7cdf7)]:
  - @data-client/core@0.9.0

## 0.8.1

### Patch Changes

- [#2797](https://github.com/reactive/data-client/pull/2797) [`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee) Thanks [@ntucker](https://github.com/ntucker)! - Fix published dependency range

- Updated dependencies [[`c6ee872c7d`](https://github.com/reactive/data-client/commit/c6ee872c7d4bb669fa7b08a5343b24419c797cee)]:
  - @data-client/core@0.8.1

## 0.8.0

### Minor Changes

- [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: Remove all /next exports

- [#2787](https://github.com/reactive/data-client/pull/2787) [`8ec35d7143`](https://github.com/reactive/data-client/commit/8ec35d71437c4042c6cb824eceb490d31c36ae21) Thanks [@ntucker](https://github.com/ntucker)! - Remove makeCacheProvider

  Current testing version is already [using the provider Component directly](https://dataclient.io/docs/api/makeRenderDataClient)

  ```tsx
  import { CacheProvider } from "@data-client/react";
  const renderDataClient = makeRenderDataClient(CacheProvider);
  ```

- [#2785](https://github.com/reactive/data-client/pull/2785) [`c6a2071178`](https://github.com/reactive/data-client/commit/c6a2071178c82c7622713c40c5a9fa5807c4e756) Thanks [@ntucker](https://github.com/ntucker)! - Add className to error boundary and errorClassName to [AsyncBoundary](https://dataclient.io/docs/api/AsyncBoundary)

  ```tsx
  <AsyncBoundary errorClassName="error">
    <Stuff/>
  </AsyncBounary>
  ```

  ```tsx
  <NetworkErrorBoundary className="error">
    <Stuff />
  </NetworkErrorBoundary>
  ```

- [#2784](https://github.com/reactive/data-client/pull/2784) [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING CHANGES:

  - DELETE removed -> INVALIDATE
  - drop all support for legacy schemas
    - entity.expiresAt removed
    - Collections.infer does entity check
    - all Entity overrides for backcompat are removed - operates just like EntitySchema, except with extra validation

- [#2782](https://github.com/reactive/data-client/pull/2782) [`d3343d42b9`](https://github.com/reactive/data-client/commit/d3343d42b970d075eda201cb85d201313120807c) Thanks [@ntucker](https://github.com/ntucker)! - Remove all 'receive' action names (use 'set' instead)

  BREAKING CHANGE:

  - remove ReceiveAction
  - ReceiveTypes -> SetTypes
  - remove Controller.receive Controller.receiveError
  - NetworkManager.handleReceive -> handleSet

- [#2791](https://github.com/reactive/data-client/pull/2791) [`a726d9178a`](https://github.com/reactive/data-client/commit/a726d9178a60fd81ff97d862ed4943e1fd4814c0) Thanks [@ntucker](https://github.com/ntucker)! - CacheProvider elements no longer share default managers

  New export: `getDefaultManagers()`

  BREAKING CHANGE: Newly mounted CacheProviders will have new manager
  objects when default is used

- [#2795](https://github.com/reactive/data-client/pull/2795) [`79e286109b`](https://github.com/reactive/data-client/commit/79e286109b5566f8e7acfdf0f44201263072d1d1) Thanks [@ntucker](https://github.com/ntucker)! - BREAKING: [Schema Serializers](https://dataclient.io/rest/guides/network-transform#deserializing-fields) _must_ support function calls

  This means Date will no longer work like before. Possible migrations:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = "Ticker";

    static schema = {
      price: Number,
      time: Temporal.Instant.from,
    };
  }
  ```

  or to continue using Date:

  ```ts
  class Ticker extends Entity {
    trade_id = 0;
    price = 0;
    time = Temporal.Instant.fromEpochSeconds(0);

    pk(): string {
      return `${this.trade_id}`;
    }
    static key = "Ticker";

    static schema = {
      price: Number,
      time: (iso: string) => new Date(iso),
    };
  }
  ```

- [#2781](https://github.com/reactive/data-client/pull/2781) [`5ff1d65eb5`](https://github.com/reactive/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853) Thanks [@ntucker](https://github.com/ntucker)! - Prefix action types with 'rdc'

  BREAKING CHANGE: Action types have new names

### Patch Changes

- [#2779](https://github.com/reactive/data-client/pull/2779) [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252) Thanks [@ntucker](https://github.com/ntucker)! - Update jsdocs references to dataclient.io

- Updated dependencies [[`837cf57883`](https://github.com/reactive/data-client/commit/837cf57883544c7640344a01f43bf6d9e3369083), [`f65cf832f0`](https://github.com/reactive/data-client/commit/f65cf832f0cdc4d01cb2f389a2dc2b37f1e5cf04), [`c865415ce5`](https://github.com/reactive/data-client/commit/c865415ce598d2b882262f795c4a816b2aa0808a), [`ff51e71f45`](https://github.com/reactive/data-client/commit/ff51e71f45857eb172f3fe05829e34c9abb68252), [`c535f6c0ac`](https://github.com/reactive/data-client/commit/c535f6c0ac915b5242c1c7694308b7ee7aab16a1), [`d3343d42b9`](https://github.com/reactive/data-client/commit/d3343d42b970d075eda201cb85d201313120807c), [`5ff1d65eb5`](https://github.com/reactive/data-client/commit/5ff1d65eb526306f2a78635b659f29554625e853)]:
  - @data-client/core@0.8.0

## 0.4.3

### Patch Changes

- f95dbc64d1: [Collections](https://dataclient.io/rest/api/Collection) can filter based on FormData arguments

  ```ts
  ctrl.fetch(getPosts.push, { group: "react" }, new FormData(e.currentTarget));
  ```

  Say our FormData contained an `author` field. Now that newly created
  item will be properly added to the [collection list](https://dataclient.io/rest/api/Collection) for that author.

  ```ts
  useSuspense(getPosts, {
    group: "react",
    author: "bob",
  });
  ```

  In this case if `FormData.get('author') === 'bob'`, it will show
  up in that [useSuspense()](https://dataclient.io/docs/api/useSuspense) call.

  See more in the [Collection nonFilterArgumentKeys example](https://dataclient.io/rest/api/Collection#nonfilterargumentkeys)

- Updated dependencies [f95dbc64d1]
  - @data-client/core@0.4.3

## 0.4.2

### Patch Changes

- 991c415135: Update readme
- Updated dependencies [b60a4a558e]
  - @data-client/core@0.4.2

## 0.4.1

### Patch Changes

- a097d25e7a: controller.fetchIfStale() resolves to data from store if it does not fetch
- Updated dependencies [a097d25e7a]
  - @data-client/core@0.4.1

## 0.4.0

### Minor Changes

- 5cedd4485e: Add controller.fetchIfStale()

  Fetches only if endpoint is considered '[stale](../concepts/expiry-policy.md#stale)'; otherwise returns undefined.

  This can be useful when prefetching data, as it avoids overfetching fresh data.

  An [example](https://stackblitz.com/github/reactive/data-client/tree/master/examples/github-app?file=src%2Frouting%2Froutes.tsx) with a fetch-as-you-render router:

  ```ts
  {
    name: 'IssueList',
    component: lazyPage('IssuesPage'),
    title: 'issue list',
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
      searchParams: URLSearchParams,
    ) => {
      const q = searchParams?.get('q') || 'is:issue is:open';
      await controller.fetchIfStale(IssueResource.search, {
        owner,
        repo,
        q,
      });
    },
  },
  ```

### Patch Changes

- Updated dependencies [5cedd4485e]
  - @data-client/core@0.4.0

## 0.3.0

### Minor Changes

- 6fd842e464: Add controller.expireAll() that sets all responses to _STALE_

  ```ts
  controller.expireAll(ArticleResource.getList);
  ```

  This is like controller.invalidateAll(); but will continue showing
  stale data while it is refetched.

  This is sometimes useful to trigger refresh of only data presently shown
  when there are many parameterizations in cache.

### Patch Changes

- 6fd842e464: Update README examples to have more options configured
- Updated dependencies [6fd842e464]
  - @data-client/core@0.3.0

## 0.2.3

### Patch Changes

- 7b835f113a: Improve package tags
- Updated dependencies [7b835f113a]
  - @data-client/core@0.2.1

## 0.2.2

### Patch Changes

- f1550bfef1: docs: Update readme examples based on project root readme
- 960b120f56: docs: Update hash links for Managers
- 954e06e839: docs: Update README
- 8eb1d2a651: docs: Update README links for docs site changes

## 0.2.1

### Patch Changes

- e916b88e45: Readme/package meta typo fixes

## 0.2.0

### Minor Changes

- bf141cb5a5: Removed deprecated Endpoint.optimisticUpdate -> use Endpoint.getOptimisticResponse
- bf141cb5a5: Deprecations:
  - controller.receive, controller.receiveError
  - RECEIVE_TYPE
  - MiddlewareAPI.controller (MiddlewareAPI is just controller itself)
    - ({controller}) => {} -> (controller) => {}
- 54019cbd57: Remove DispatchContext, DenormalizeCacheContext (previously deprecated)
- 54019cbd57: Add INVALID to \_\_INTERNAL\_\_
- bf141cb5a5: createFetch, createReceive, createReceiveError removed from \_\_INTERNAL\_\_
  These were previously deprecated.
- bf141cb5a5: NetworkManager interface changed to only support new actions
  SubscriptionManager/PollingSubscription interfaces simplified based on new actions
- 9788090c55: Controller.fetch() returns denormalized form when Endpoint has a Schema

### Patch Changes

- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [9788090c55]
- Updated dependencies [bf141cb5a5]
- Updated dependencies [bf141cb5a5]
  - @data-client/core@0.2.0
