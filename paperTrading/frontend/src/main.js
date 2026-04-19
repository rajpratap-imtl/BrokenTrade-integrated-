import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { wsService } from "./utils/websocketService";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

const websocketUrl = import.meta.env.VITE_WS_URL || "ws://localhost:5000/stream";
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
