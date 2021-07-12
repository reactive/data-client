## Todo App

This uses the todo endpoint of [json placeholder](https://jsonplaceholder.typicode.com/)

### Getting started

From rest-hooks root (`../..` from here) first build packages:

```bash
yarn install
yarn build
```

### Dev server

```bash
cd ./examples/todo-app
NO_HOT_RELOAD='true' yarn start
```

### Production build

Next, prepare production build and start serving the built files

```bash
cd ./examples/todo-app
yarn build:browser
yarn prod
```
