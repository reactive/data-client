---
name: data-client-rest-setup
description: Set up and migrate to @data-client/rest for REST APIs. Detects existing HTTP patterns (axios, fetch, ky, superagent, got) and migrates them. Creates custom RestEndpoint base class with common behaviors. Use when adopting @data-client/rest in a new or existing project.
disable-model-invocation: true
---

# REST Protocol Setup & Migration

Setting up `@data-client/rest` only defines endpoints and schemas, so it needs no Data Client provider: leave how the app loads and stores data alone unless the user asks to change it.

APIs: [RestEndpoint](references/RestEndpoint.md), [resource](references/resource.md). Vue projects: read `<name>.vue.md` instead of `<name>.md` when it exists.

## Step 1: Install

Install `@data-client/rest` with the project's package manager. It ships the skills this setup uses next (`data-client-rest`, and `data-client-schema` from `@data-client/endpoint`); link them from the project root:

```bash
npx --no data-client-skills   # pnpm exec data-client-skills, yarn data-client-skills
```

- If a skill isn't available by name afterwards, read `.claude/skills/<skill>/SKILL.md`.
- If the command isn't found, the installed version predates 0.19: run `npx skills add reactive/data-client --skill data-client-rest --skill data-client-schema -y` instead.
- Add this line to `AGENTS.md` (create it if missing; if a `CLAUDE.md` exists, make sure it has an `@AGENTS.md` line), with the project's package manager in the command, and commit `.agents/skills` and `.claude/skills`:

```md
After adding, removing or upgrading `@data-client/*` packages, run `npx --no data-client-skills` and commit the skill links.
```

## Step 2: Migrate each HTTP library

Check `package.json` and imports. Several libraries can coexist: migrate each one's files with its reference. If HTTP calls exist but the library is unclear, ask the user.

| Detected | Follow |
|----------|--------|
| `axios` | [Axios migration](references/axios-migration.md), with the steps below |
| `fetch(` calls or wrappers around fetch | [Fetch migration](references/fetch-migration.md) |
| `ky` | [Ky migration](references/ky-migration.md) |
| `superagent` | [SuperAgent migration](references/superagent-migration.md) |
| `got` | [Got migration](references/got-migration.md) |
| none | Step 3 |

Axios:

1. Check `git status` is clean (commit or ask first), so the codemod's changes can be reviewed on their own.
2. Run the codemod before any manual edits, on the source folders (never the repo root): `npx jscodeshift -t https://dataclient.io/codemods/axios-to-rest.js --extensions=ts,tsx,js,jsx src/`. It turns each axios call into an endpoint call, turns each `axios.create()` instance into a base endpoint class, and drops `.data` unless a response interceptor may have unwrapped it.
3. Search the source for `TODO(data-client)`. Each comment names one thing to finish and links its guide section, which is in the reference under the same heading. Resolve it, then delete the comment.
4. Follow the reference's remaining steps. Callers keep loading data the way they did; only the call changes.
5. Run the type checker and tests. When no `axios` import or `TODO(data-client)` comment is left, uninstall axios.

## Step 3: Base endpoint class

Put the project's shared request behavior in one `RestEndpoint` subclass and build every endpoint from it. If a migration made one (the axios codemod does, from `axios.create()`), add to that class instead of creating another.

```ts
import { RestEndpoint, RestGenerics } from '@data-client/rest';

export class BaseEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  urlPrefix = 'https://api.example.com';

  getHeaders(headers: HeadersInit): HeadersInit {
    const token = localStorage.getItem('authToken');
    return { ...headers, ...(token && { Authorization: `Bearer ${token}` }) };
  }
}
```

Override only what the app does today:

| Behavior | Override |
|----------|----------|
| Auth or other headers (may be `async`, e.g. token refresh) | `getHeaders(headers)` |
| Auth token from React context (Okta, Auth0) | [`hookifyResource()`](references/hookifyResource.md); a base class can't read context |
| Cookies, CSRF, other `RequestInit` | `getRequestInit(body)`, spreading `super.getRequestInit(body)` |
| Transform the response: unwrap an envelope like `{ "data": {...}, "meta": {...} }`, convert case | `process(value)`, e.g. `return value?.data` (`value` is null for a 204). Not axios's `response.data`: that is axios's wrapper, which the codemod already removed |
| Date fields | Not `process()`: the Entity's `static schema`, e.g. `createdAt: Temporal.Instant.from` (skill "data-client-schema") |
| Status handling, like a 401 redirect | `async fetchResponse(input, init)`: `super.fetchResponse()` throws a `NetworkError` for any non-2xx status, so wrap it in `try`, check `error.status` in `catch`, and rethrow ([Server error messages](references/axios-migration.md#server-error-messages) shows it) |
| Arrays or nested objects in the query | `searchToString(searchParams)`, e.g. `qs.stringify(searchParams, { arrayFormat: 'brackets' })` |
| Non-JSON responses (files, text) | The [`content`](references/RestEndpoint.md#content) option, e.g. `content: 'blob'`; otherwise `parseResponse(response)` |

Request bodies need no override: a plain object or array is sent as JSON, and anything else (`FormData`, `URLSearchParams`, a string) as-is ([getRequestInit](references/RestEndpoint.md#getRequestInit)).

## Defining endpoints

**`resource()`** for standard CRUD on one path (`get`, `getList`, `create`, `update`, `partialUpdate`, `delete`):

```ts
export const TodoResource = resource({
  path: '/todos/:id',
  schema: Todo,
  Endpoint: BaseEndpoint,
});
```

**`new BaseEndpoint({ ... })`** for anything else (search, auth, custom actions). Type a body with a truthy value, `body: {} as { email: string; password: string }`, never `undefined as unknown as T`: the endpoint only sends a body when `body` is set.

If the codebase validates responses with Zod or Yup, keep that by parsing in `process()` and still add an Entity `schema`; see "Coexisting with Zod or Yup" in the [Axios migration](references/axios-migration.md).

## Next steps

1. Define Entity classes (skill "data-client-schema") and set each endpoint's `schema:`. Without one, responses aren't normalized or cached.
2. Apply skill "data-client-rest" for resource and endpoint patterns.
3. Only when the user asks to move components onto the store: apply skill "data-client-react" or "data-client-vue".

More: [Authentication](references/auth.md), [Django REST Framework](references/django.md).
