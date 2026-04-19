import { createMemoryHistory, createRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import ChartView from '../views/ChartView.vue';

const routes = [
    { 
        path: '/', 
        component: ChartView,
        meta: { requiresAuth: true }
    },
];

const router = createRouter({
    history: createMemoryHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    console.log('[Router] beforeEach called, to:', to.path);
    const authStore = useAuthStore();

    console.log('[Router] Auth store loading state:', authStore.loading);
    console.log('[Router] Auth store token exists:', !!authStore.token);
    console.log('[Router] Token value:', authStore.token ? authStore.token.substring(0, 30) + '...' : 'null');

    if (to.meta.requiresAuth) {
        // Wait for auth store to finish loading (in case it's still loading from storage)
        if (authStore.loading) {
            console.log('[Router] Waiting for auth store to finish loading...');
            // Give the auth store a moment to load from storage
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('[Router] After wait - token exists:', !!authStore.token);

        // Check if backend is available
        const backendAvailable = await authStore.checkBackendAvailability();
        console.log('[Router] Backend available:', backendAvailable);
        
        if (!backendAvailable) {
            authStore.error = 'Main platform is not available';
            authStore.redirectToLogin('Main platform is not available');
            return next(false); // Prevent navigation
        }

        // Verify authentication
        console.log('[Router] Calling verifyToken...');
        const isValid = await authStore.verifyToken();
        console.log('[Router] Token valid:', isValid);
        
        if (!isValid) {
            return next(false); // Prevent navigation, verifyToken handles redirect
        }
    }

    console.log('[Router] Proceeding to route');
    next();
});

export default router;