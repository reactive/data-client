<template>
  <div class="user-header">
    <h1>📝 {{ user.name }}'s Todos</h1>
    <p class="subtitle">@{{ user.username }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSuspense } from '@data-client/vue';
import { UserResource } from '../resources/UserResource';

const route = useRoute();
const params = computed(() => ({ id:Number(route.params.userId)}));

const user = await useSuspense(UserResource.get, params);
</script>

<style scoped>
.user-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 14px;
}
</style>

