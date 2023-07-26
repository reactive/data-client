## Github App

### Getting started (remote)

See this demo live in your browser at [Stackblitz](https://stackblitz.com/github/data-client/rest-hooks/tree/rest-hooks-site/examples/github-app)

### Getting started (local)

From rest-hooks root (`../..` from here) first build packages:

```bash
yarn install
yarn build
```

### Dev server

```bash
cd ./examples/github-app
yarn start
```

### Production build

Next, prepare production build and start serving the built files

```bash
cd ./examples/github-app
yarn build:browser
yarn prod
```
