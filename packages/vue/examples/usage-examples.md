# Vue 3 Data Client Usage Examples

This document shows how to use both the composable and plugin approaches for providing Reactive Data Client in Vue 3 applications.

## Using the Composable (useDataClient)

The composable approach is perfect when you want to provide the data client in a specific component or when you need more control over the setup.

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <MyComponent />
  </div>
</template>

<script setup lang="ts">
import { useDataClient } from '@data-client/vue';

// Provide the data client using the composable
useDataClient({
  managers: getDefaultManagers(),
  initialState: customInitialState,
});
</script>
```

## Using the Plugin (DataClientPlugin)

The plugin approach is ideal when you want to provide the data client globally across your entire application.

### main.ts

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';

const app = createApp(App);

// Install the plugin globally
app.use(DataClientPlugin, {
  managers: getDefaultManagers(),
  initialState: customInitialState,
  // Controller: CustomController,
  // gcPolicy: customGCPolicy,
});

app.mount('#app');
```

### Using in Components

Once the plugin is installed, you can use data client hooks in any component without additional setup:

```vue
<!-- MyComponent.vue -->
<template>
  <div>
    <h1>{{ user.value?.name }}</h1>
    <p>{{ user.value?.email }}</p>
  </div>
</template>

<script setup lang="ts">
import { useSuspense, useController } from '@data-client/vue';
import { UserResource } from './resources';

const props = defineProps<{ userId: string }>();

// These hooks work automatically with the plugin
const user = await useSuspense(UserResource.get, { id: props.userId });
const ctrl = useController();

const updateUser = (data: Partial<User>) => {
  return ctrl.fetch(UserResource.update, { id: props.userId }, data);
};
</script>
```

## Migration Guide

### From Composable to Plugin

If you're currently using the composable in your root component, you can easily migrate to the plugin:

**Before (Composable):**
```vue
<!-- App.vue -->
<script setup lang="ts">
import { useDataClient } from '@data-client/vue';

useDataClient({
  managers: getDefaultManagers(),
});
</script>
```

**After (Plugin):**
```typescript
// main.ts
import { createApp } from 'vue';
import { DataClientPlugin, getDefaultManagers } from '@data-client/vue';

const app = createApp(App);
app.use(DataClientPlugin, {
  managers: getDefaultManagers(),
});
app.mount('#app');
```

```vue
<!-- App.vue - no longer needs provider setup -->
<template>
  <MyComponent />
</template>
```

## Benefits of Each Approach

### Composable (useDataClient)
- ✅ More explicit control over setup
- ✅ Can be used in multiple components if needed
- ✅ Easier to test in isolation
- ✅ Follows Vue 3 composition API patterns

### Plugin (DataClientPlugin)
- ✅ Global setup - no need to remember to add to root component
- ✅ Cleaner component code
- ✅ Automatic lifecycle management
- ✅ Better for larger applications
- ✅ Follows Vue 3 plugin patterns

Choose the approach that best fits your application's architecture and team preferences!
