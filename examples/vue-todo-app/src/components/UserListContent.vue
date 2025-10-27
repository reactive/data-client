<template>
  <div class="user-list-wrapper">
    <div class="header">
      <h1>👥 All Users</h1>
      <p class="subtitle">Select a user to view and manage their todos</p>
    </div>
    <div class="user-list">
      <router-link
        v-for="user in users"
        :key="user.id"
        :to="`/user/${user.id}/todos`"
        class="user-card"
      >
        <div class="user-avatar">
          <img :src="user.profileImage" :alt="user.name" />
        </div>
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p class="username">@{{ user.username }}</p>
          <p class="email">{{ user.email }}</p>
        </div>
        <div class="arrow">→</div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSuspense } from '@data-client/vue';
import { UserResource } from '../resources/UserResource';

const users = await useSuspense(UserResource.getList);
</script>

<style scoped>
.user-list-wrapper {
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

.user-list {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .user-list {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.user-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  gap: 16px;
}

.user-card:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.1);
}

.user-avatar {
  flex-shrink: 0;
}

.user-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #e0e0e0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h3 {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.username {
  margin: 0 0 4px;
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.email {
  margin: 0;
  font-size: 13px;
  color: #9e9e9e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow {
  font-size: 24px;
  color: #667eea;
  font-weight: bold;
  transition: transform 0.2s;
}

.user-card:hover .arrow {
  transform: translateX(4px);
}
</style>

