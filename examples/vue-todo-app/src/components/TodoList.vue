<template>
  <div class="todo-list">
    <div class="header">
      <Suspense>
        <template #default>
          <UserHeader />
        </template>
        <template #fallback>
          <h1>📝 Todo App</h1>
        </template>
      </Suspense>
    </div>

    <div class="add-todo">
      <input
        v-model="newTodoTitle"
        @keyup.enter="handleAdd"
        placeholder="What needs to be done?"
        class="todo-input"
        :disabled="isLoading"
      />
      <button @click="handleAdd" class="add-btn" :disabled="isLoading">{{isLoading ? ' ... ' : 'Add'}}</button>
    </div>

    <Suspense>
      <template #default>
        <TodoListContent />
      </template>
      <template #fallback>
        <div class="loading">Loading todos...</div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useController, useLoading } from '@data-client/vue';
import { TodoResource } from '../resources/TodoResource';
import TodoListContent from './TodoListContent.vue';
import UserHeader from './UserHeader.vue';

const route = useRoute();
const ctrl = useController();
const newTodoTitle = ref('');

const userId = computed(() => Number(route.params.userId));

const [handleAdd, isLoading] = useLoading(async () => {
  if (!newTodoTitle.value.trim()) return;
  
  await ctrl.fetch(TodoResource.getList.unshift, { userId: userId.value }, {
    title: newTodoTitle.value,
    userId: userId.value,
    completed: false,
  });
  
  newTodoTitle.value = '';
});
</script>

<style scoped>
.todo-list {
  max-width: 600px;
  margin: 20px auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

@media (max-width: 768px) {
  .todo-list {
    margin: 20px 12px;
  }
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.add-todo {
  display: flex;
  padding: 20px;
  gap: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: #667eea;
}

.add-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #5568d3;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #9e9e9e;
  font-size: 16px;
}
</style>

