# Vue Todo App with Data Client

A simple Todo application demonstrating the use of `@data-client/vue` for reactive state management in Vue 3.

## Features

- ✅ Add, toggle, and delete todos
- 🔄 Optimistic updates for instant UI feedback
- 🌐 RESTful API integration with JSONPlaceholder
- 💾 Automatic caching and normalization
- 🎨 Modern, responsive UI
- ⚡ Built with Vite for fast development

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **@data-client/vue** - Reactive normalized state management
- **@data-client/rest** - REST resource definitions
- **TypeScript** - Type safety
- **Vite** - Build tool

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
vue-todo-app/
├── src/
│   ├── components/
│   │   ├── TodoItem.vue          # Individual todo item component
│   │   ├── TodoList.vue          # Main todo list container
│   │   └── TodoListContent.vue   # Todo list content with suspense
│   ├── resources/
│   │   ├── PlaceholderBaseResource.ts  # Base resource configuration
│   │   ├── TodoResource.ts             # Todo entity and endpoints
│   │   └── UserResource.ts             # User entity and endpoints
│   ├── App.vue                   # Root component
│   └── main.ts                   # App entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Key Concepts

### Data Client Integration

The app uses `@data-client/vue` for state management:

- **`DataClientPlugin`** - Vue plugin that provides data client functionality
- **`useSuspense`** - Composable for suspense-based data fetching
- **`useController`** - Composable for triggering mutations (create, update, delete)

### Resource Definitions

Resources are defined using `@data-client/rest`:

- **Entities** - Type-safe data models with normalization
- **Resources** - CRUD endpoints for entities
- **Schemas** - Query definitions for derived data

### Optimistic Updates

The app uses optimistic updates for instant UI feedback. Changes appear immediately while the API request is in flight.

## API

This app uses the [JSONPlaceholder](https://jsonplaceholder.typicode.com) API for demonstration purposes. Note that the API doesn't persist changes, but the app simulates persistence through Data Client's caching.

## Learn More

- [Data Client Documentation](https://dataclient.io)
- [Vue 3 Documentation](https://vuejs.org)
- [@data-client/vue Package](https://www.npmjs.com/package/@data-client/vue)

