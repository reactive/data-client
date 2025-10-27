<template>
  <div>
    <div v-if="todos.length === 0" class="empty-state">
      <p>No todos yet! Add one above to get started.</p>
    </div>
    <div v-else class="todos-container">
      <TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" />
    </div>
    <div class="footer">
      <span class="count">{{ remaining }} items left</span>
      <span class="total">{{ todos.length }} total</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuery, useSuspense } from '@data-client/vue';
import { TodoResource, queryRemainingTodos } from '../resources/TodoResource';
import TodoItem from './TodoItem.vue';

const todos = await useSuspense(TodoResource.getList, { userId: 1 });
const remaining = useQuery(queryRemainingTodos, { userId: 1 });
</script>

<style scoped>
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #9e9e9e;
  font-size: 16px;
}

.todos-container {
  max-height: 500px;
  overflow-y: auto;
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
  font-size: 14px;
  color: #666;
}

.count {
  font-weight: 600;
}

.total {
  color: #9e9e9e;
}
</style>

