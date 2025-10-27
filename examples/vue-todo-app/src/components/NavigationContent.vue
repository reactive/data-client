<template>
  <div class="nav-users">
    <div class="user-links">
      <router-link
        v-for="user in users"
        :key="user.id"
        :to="`/user/${user.id}/todos`"
        class="user-link"
        :class="{ active: isActive(user.id) }"
        :title="user.name"
      >
        <img :src="user.profileImage" :alt="user.name" class="user-avatar-small" />
        <span class="user-link-text">{{ user.name }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useSuspense } from '@data-client/vue';
import { UserResource } from '../resources/UserResource';

const route = useRoute();
const users = await useSuspense(UserResource.getList);

const isActive = (userId: number) => {
  return route.params.userId === String(userId);
};
</script>

<style scoped>
.nav-users {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

.nav-label {
  color: white;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.9;
}

.user-links {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  padding: 4px 0;
}

.user-links::-webkit-scrollbar {
  height: 6px;
}

.user-links::-webkit-scrollbar-track {
  background: transparent;
}

.user-links::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.user-links::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.user-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid transparent;
  border-radius: 20px;
  color: white;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.user-link:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.user-link.active {
  background: white;
  color: #667eea;
  border-color: white;
  font-weight: 600;
}

.user-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.user-link.active .user-avatar-small {
  border-color: #667eea;
}

.user-link-text {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .user-link-text {
    display: none;
  }
  
  .user-link {
    padding: 6px;
  }
}
</style>

