## Todo App

This uses the todo endpoint of [json placeholder](https://jsonplaceholder.typicode.com/)

### Getting started (remote)

See this demo live in your browser at [Stackblitz](https://stackblitz.com/github/data-client/rest-hooks/tree/rest-hooks-site/examples/todo-app)

### Getting started (local)

From rest-hooks root (`../..` from here) first build packages:

```bash
yarn install
yarn build
```

### Dev server

```bash
cd ./examples/todo-app
yarn start
```

### Production build

Next, prepare production build and start serving the built files

```bash
cd ./examples/todo-app
yarn build:browser
yarn prod
```
