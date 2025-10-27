<template>
  <div class="todo-list">
    <div class="header">
      <h1>📝 Vue Todo App</h1>
      <p class="subtitle">Powered by @data-client/vue</p>
    </div>

    <div class="add-todo">
      <input
        v-model="newTodoTitle"
        @keyup.enter="handleAdd"
        placeholder="What needs to be done?"
        class="todo-input"
      />
      <button @click="handleAdd" class="add-btn">Add</button>
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
import { ref } from 'vue';
import { useController } from '@data-client/vue';
import { TodoResource } from '../resources/TodoResource';
import TodoListContent from './TodoListContent.vue';

const ctrl = useController();
const newTodoTitle = ref('');

const handleAdd = async () => {
  if (!newTodoTitle.value.trim()) return;
  
  await ctrl.fetch(TodoResource.getList.unshift, {userId: 1}, {
    title: newTodoTitle.value,
    userId: 1,
    completed: false,
  });
  
  newTodoTitle.value = '';
};
</script>

<style scoped>
.todo-list {
  max-width: 600px;
  margin: 40px auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 24px;
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

