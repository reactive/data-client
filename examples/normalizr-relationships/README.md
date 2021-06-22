# Dealing with Relationships

Occasionally, it is useful to have all one-to-one, one-to-many, and many-to-many relationship data on entities. [@rest-hooks/normalizr](/packages/normalizr) does not handle this automatically, but this example shows a simple way of adding relationship handling on a special-case basis.

## Running

```sh
# from the root directory:
yarn
# from this directory:
yarn start
```

## Files

* [index.js](/examples/relationships/index.js): Pulls live data from input.json and normalizes the JSON.
* [input.json](/examples/relationships/input.json): The raw JSON data before normalization.
* [output.json](/examples/relationships/output.json): The normalized output.
* [schema.js](/examples/relationships/schema.js): The schema used to normalize.
