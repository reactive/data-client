---
"@data-client/normalizr": patch
'@data-client/endpoint': patch
---

Always normalize pk to string type

Warning: This will affect contents of the store state (some numbers will appear as strings)

Before:

```json
{
  "Article": {
    "123": {
      "author": 8472,
      "id": 123,
      "title": "A Great Article",
    },
  },
  "User": {
    "8472": {
      "id": 8472,
      "name": "Paul",
    },
  },
}
```

After:

```json
{
  "Article": {
    "123": {
      "author": "8472",
      "id": 123,
      "title": "A Great Article",
    },
  },
  "User": {
    "8472": {
      "id": 8472,
      "name": "Paul",
    },
  },
}
```