import { DataClientPlugin } from '@data-client/vue';
import { createApp } from 'vue';

import App from './App.vue';

const app = createApp(App);

// Install Data Client plugin
app.use(DataClientPlugin);

app.mount('#app');
