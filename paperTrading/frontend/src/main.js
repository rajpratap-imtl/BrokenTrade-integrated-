import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { wsService } from "./utils/websocketService";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

// Use relative WebSocket URL when served from same server
const websocketUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/stream`;
wsService.connect(websocketUrl);
app.config.globalProperties.$wss = wsService;

app
  .use(pinia)
  .use(router);

// Initialize auth before mounting
const authStore = useAuthStore();
console.log('[Main] Initializing auth store...');
authStore.loadFromStorage();
console.log('[Main] Auth store initialized, token exists:', !!authStore.token);

app.mount("#app");
