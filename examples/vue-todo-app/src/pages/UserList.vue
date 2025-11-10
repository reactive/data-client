<template>
  <div class="user-list-page">
    <Suspense>
      <template #default>
        <UserListContent />
      </template>
      <template #fallback>
        <div class="loading">Loading users...</div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import UserListContent from '../components/UserListContent.vue';
</script>

<style scoped>
.user-list-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 20px;
}

@media (max-width: 768px) {
  .user-list-page {
    padding: 20px 12px;
  }
}

.loading {
  padding: 40px;
  text-align: center;
  color: #9e9e9e;
  font-size: 16px;
}
</style>

