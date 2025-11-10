import { DataClientPlugin } from '@data-client/vue';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';

const app = createApp(App);

// Install plugins
app.use(DataClientPlugin);
app.use(router);

app.mount('#app');
