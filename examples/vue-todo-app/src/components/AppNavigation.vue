<template>
  <nav class="app-nav">
    <div class="nav-container">
      <router-link to="/" class="nav-brand">
        📝 Vue Todos
      </router-link>
      
      <Suspense>
        <template #default>
          <NavigationContent />
        </template>
        <template #fallback>
          <div class="nav-loading">Loading...</div>
        </template>
      </Suspense>
    </div>
  </nav>
</template>

<script setup lang="ts">
import NavigationContent from './NavigationContent.vue';
</script>

<style scoped>
.app-nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-brand {
  color: white;
  text-decoration: none;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.nav-brand:hover {
  opacity: 0.9;
}

.nav-loading {
  color: white;
  font-size: 14px;
  opacity: 0.8;
}
</style>

