import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(null);
  const loading = ref(true);
  const error = ref('');

  const isAuthenticated = computed(() => !!token.value);

  function loadFromStorage() {
    console.log('[Auth] Loading from storage...');
    try {
      // First, check if token is in URL hash (passed from BrokenTrade)
      if (window.location.hash) {
        console.log('[Auth] Found hash in URL:', window.location.hash);
        const hash = window.location.hash.substring(1); // Remove #
        const params = new URLSearchParams(hash);
        const tokenFromUrl = params.get('token');
        const userFromUrl = params.get('user');
        
        if (tokenFromUrl && userFromUrl) {
          console.log('[Auth] Token found in URL, storing in localStorage');
          localStorage.setItem('brokentrade_token', tokenFromUrl);
          localStorage.setItem('brokentrade_user', userFromUrl);
          
          // Clear the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      
      // Now load from localStorage
      const storedToken = localStorage.getItem('brokentrade_token');
      const storedUser = localStorage.getItem('brokentrade_user');
      
      console.log('[Auth] Stored token exists:', !!storedToken);
      console.log('[Auth] Stored user exists:', !!storedUser);
      
      if (storedToken && storedUser) {
        token.value = storedToken;
        user.value = JSON.parse(storedUser);
        console.log('[Auth] Loaded user:', user.value);
      } else {
        console.log('[Auth] No stored credentials found');
      }
    } catch (e) {
      console.error('[Auth] Failed to load auth from storage:', e);
      clearAuth();
    } finally {
      loading.value = false;
      console.log('[Auth] Loading complete');
    }
  }

  async function verifyToken() {
    console.log('[Auth] Verifying token...');
    console.log('[Auth] Token exists:', !!token.value);
    console.log('[Auth] Token value:', token.value ? token.value.substring(0, 50) + '...' : 'null');
    
    if (!token.value) {
      console.log('[Auth] No token found, redirecting to login');
      error.value = 'Please log in to access Paper Trading.';
      redirectToLogin(error.value);
      return false;
    }

    try {
      console.log('[Auth] Calling /api/auth/verify endpoint...');
      const response = await fetch('http://localhost:5001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token.value}`,
        },
      });

      console.log('[Auth] Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.log('[Auth] Verification failed:', data);
        const errorCode = data.error?.code;
        
        if (errorCode === 'TOKEN_EXPIRED') {
          error.value = 'Your session has expired. Please log in again.';
        } else if (errorCode === 'INVALID_TOKEN') {
          error.value = 'Your session has expired. Please log in again.';
        } else if (errorCode === 'USER_NOT_FOUND') {
          error.value = 'Your session has expired. Please log in again.';
        } else {
          error.value = data.error?.message || 'Authentication failed. Please log in again.';
        }
        
        clearAuth();
        redirectToLogin(error.value);
        return false;
      }

      const data = await response.json();
      console.log('[Auth] Verification successful:', data);
      user.value = data.user;
      error.value = ''; // Clear error on success
      return true;
    } catch (err) {
      console.error('[Auth] Token verification failed with exception:', err);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        error.value = 'Unable to connect to the server. Please check your connection.';
      } else {
        error.value = 'Authentication failed. Please log in again.';
      }
      
      clearAuth();
      redirectToLogin(error.value);
      return false;
    }
  }

  function clearAuth() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('brokentrade_token');
    localStorage.removeItem('brokentrade_user');
  }

  function logout() {
    clearAuth();
    redirectToLogin('You have been logged out.');
  }

  function redirectToLogin(message = '') {
    const url = new URL('http://localhost:5173/login');
    if (message) {
      url.searchParams.set('message', message);
    }
    window.location.href = url.toString();
  }

  async function checkBackendAvailability() {
    try {
      const response = await fetch('http://localhost:5001/api/auth/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    loadFromStorage,
    verifyToken,
    logout,
    checkBackendAvailability,
  };
});
