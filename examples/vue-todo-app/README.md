# Vue Todo App with Data Client

A simple Todo application demonstrating the use of `@data-client/vue` for reactive state management in Vue 3.

## Features

- 👥 Browse all users from JSONPlaceholder
- 🧭 **Universal Navigation** - Quick-switch between users from any page
- ✅ Add, toggle, and delete todos for any user
- 🔄 Optimistic updates for instant UI feedback
- 🛣️ Vue Router integration for navigation
- 🌐 RESTful API integration with JSONPlaceholder
- 💾 Automatic caching and normalization
- 🎨 Modern, responsive UI with sticky navigation
- ⚡ Built with Vite for fast development

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vue Router 4** - Official router for Vue.js
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
│   │   ├── AppNavigation.vue     # Persistent top navigation
│   │   ├── NavigationContent.vue # User switcher in navigation
│   │   ├── TodoItem.vue          # Individual todo item component
│   │   ├── TodoList.vue          # Main todo list container
│   │   ├── TodoListContent.vue   # Todo list content with suspense
│   │   ├── UserHeader.vue        # User header in todo page
│   │   └── UserListContent.vue   # User list content with suspense
│   ├── pages/
│   │   ├── UserList.vue          # Users listing page
│   │   └── UserTodos.vue         # User todos page
│   ├── resources/
│   │   ├── PlaceholderBaseResource.ts  # Base resource configuration
│   │   ├── TodoResource.ts             # Todo entity and endpoints
│   │   └── UserResource.ts             # User entity and endpoints
│   ├── App.vue                   # Root component with navigation
│   ├── main.ts                   # App entry point
│   └── router.ts                 # Vue Router configuration
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

## Usage

1. **Browse Users**: Start at the home page to see all available users
2. **View Todos**: Click on any user to view their todos
3. **Quick Switch**: Use the top navigation bar to instantly switch between any user's todos
4. **Add Todos**: Type in the input field and press Enter or click "Add"
5. **Toggle Completion**: Click the checkbox to mark todos as complete/incomplete
6. **Delete Todos**: Click the × button to delete a todo
7. **Navigate Home**: Click the "Vue Todo App" brand in the navigation to return to the user list

### Universal Navigation

The app features a persistent navigation bar at the top of every page with:
- **Home Link**: Click the brand logo to return to the user list
- **Quick User Switcher**: Horizontally scrollable list of all users with avatars
- **Active Indicator**: The current user is highlighted in the navigation
- **Responsive**: On mobile, shows only avatars; on desktop, shows names too

## Routes

- `/` - User list page
- `/user/:userId/todos` - Todos for a specific user (e.g., `/user/1/todos`)

## API

This app uses the [JSONPlaceholder](https://jsonplaceholder.typicode.com) API for demonstration purposes. Note that the API doesn't persist changes, but the app simulates persistence through Data Client's caching.

## Learn More

- [Data Client Documentation](https://dataclient.io)
- [Vue 3 Documentation](https://vuejs.org)
- [@data-client/vue Package](https://www.npmjs.com/package/@data-client/vue)

