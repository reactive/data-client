<template>
  <div class="todo-item" :class="{ completed: todo.completed }">
    <input
      type="checkbox"
      :checked="todo.completed"
      @change="handleToggle"
      :id="`todo-${todo.id}`"
    />
    <label :for="`todo-${todo.id}`">
      {{ todo.title }}
    </label>
    <button @click="handleDelete" class="delete-btn">×</button>
  </div>
</template>

<script setup lang="ts">
import { useController } from '@data-client/vue';
import { Todo, TodoResource } from '../resources/TodoResource';

const props = defineProps<{
  todo: Todo;
}>();

const ctrl = useController();

const handleToggle = async () => {
  await ctrl.fetch(TodoResource.partialUpdate, {
    id: props.todo.id,
  }, {
    completed: !props.todo.completed,
  });
};

const handleDelete = async () => {
  await ctrl.fetch(TodoResource.delete, { id: props.todo.id });
};
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  gap: 12px;
  transition: background-color 0.2s;
}

.todo-item:hover {
  background-color: #f5f5f5;
}

.todo-item.completed label {
  text-decoration: line-through;
  color: #9e9e9e;
}

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

label {
  flex: 1;
  cursor: pointer;
  font-size: 16px;
}

.delete-btn {
  background: none;
  border: none;
  color: #f44336;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background-color: #ffebee;
}
</style>

