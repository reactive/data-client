import { createRouter, createWebHistory } from 'vue-router';

import UserList from './pages/UserList.vue';
import UserTodos from './pages/UserTodos.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: UserList,
  },
  {
    path: '/user/:userId/todos',
    name: 'user-todos',
    component: UserTodos,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
