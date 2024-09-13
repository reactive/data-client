---
name: path-to-regexp-v8-migration
description: Migrate @data-client/rest path strings from path-to-regexp v6 to v8 syntax. Use when upgrading path-to-regexp, updating RestEndpoint.path or resource path strings, or when seeing errors about unexpected ?, +, (, or ) in paths.
---

# path-to-regexp v6 → v8 Migration

Applies to `path` in `RestEndpoint`, `resource()`, and any string passed to path-to-regexp.

Reference: [path-to-regexp README errors section](https://github.com/pillarjs/path-to-regexp#errors)

## Migration Rules

### Optional parameters

`?` suffix removed. Wrap the optional segment (including its prefix) in `{}`.

```
/:id?           →  {/:id}
/users/:id?     →  /users{/:id}
/files/:name?   →  /files{/:name}
```

### Repeating parameters

`+` (one-or-more) and `*` (zero-or-more) suffixes removed. Use `*name` wildcard syntax.

```
/:path+         →  /*path
/:path*         →  {/*path}
```

### Quoted parameter names

Parameter names must be valid JS identifiers. Names with special characters need double quotes.

```
/:with-dash     →  /:"with-dash"
/:my.param      →  /:"my.param"
```

### Escaping special characters

Characters `()[]{}*:;,!@` must be escaped with `\\` when used as literals. `?` and `+` are no longer special and do not need escaping.

```
/(literal)      →  /\\(literal\\)
/[bracket]      →  /\\[bracket\\]
/path?query     →  /path?query          (no change — ? is not special in v8)
\\?             →  ?                    (escape no longer needed)
```

### Custom regex removed

Inline regex like `/:id(\d+)` is no longer supported. Remove regex patterns.

```
/:id(\d+)       →  /:id
```

## Combined Examples

Optional with prefix:

```
/:attr1?{-:attr2}?{-:attr3}?   →  {/:attr1}{-:attr2}{-:attr3}
```

Query params embedded in path:

```
/search\\?q=:q?&page=:page?    →  /search?{q=:q}{&page=:page}
```

## Where to Find Paths

Search patterns for locating v6 paths in a codebase:

- `path:` properties in `RestEndpoint`, `resource()`, `.extend()` calls
- Docs under `docs/rest/api/`
- Type tests in `typescript-tests/`
- Blog posts and changelogs with code examples

## Type System

`pathTypes.ts` infers TypeScript parameter types from path strings:

- `:name` and `*name` → required parameter
- `{/:name}` and `{/*name}` → optional parameter (trailing `}` signals optionality)
- `:"quoted"` → `CleanKey` strips quotes for the property name
- `\\:` / `\\*` / `\\}` → escaped, not treated as parameters
