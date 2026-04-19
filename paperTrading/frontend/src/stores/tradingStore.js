import { defineStore } from 'pinia';
import { wsService } from '@/utils/websocketService';
import { useAuthStore } from './auth';

const TOKEN_KEY = 'brokentrade_token'; // Changed to use shared token
const BACKEND_URL = 'http://localhost:5001';

export const useTradingStore = defineStore('trading', {
  state: () => ({
    token: null,
    user: null,
    account: null,
    positions: [],
    trades: [],
    leaderboard: [],
    quantity: 1,
    email: '',
    password: '',
    error: '',
    isLoading: false,
    pnlHandler: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    balance: (state) => Number(state.account?.balance || 0),
  },

  actions: {
    // Sync token from auth store
    syncTokenFromAuth() {
      const authStore = useAuthStore();
      if (authStore.token && !this.token) {
        console.log('[TradingStore] Syncing token from auth store');
        this.token = authStore.token;
        this.user = authStore.user;
      }
    },

    authHeaders() {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      };
    },

    async request(path, options = {}) {
      // Ensure token is synced before making request
      this.syncTokenFromAuth();
      
      // Build full URL
      const fullUrl = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
      
      console.log('[TradingStore] Making request to:', fullUrl, 'with token:', this.token ? 'yes' : 'no');
      
      // Merge auth headers with provided options
      const mergedOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...options.headers,
        },
      };
      
      const response = await fetch(fullUrl, mergedOptions);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Request failed.');
      }

      return data;
    },

    setSession(session) {
      this.token = session.token;
      this.user = session.user;
      localStorage.setItem(TOKEN_KEY, this.token);
      this.attachRealtime();
      this.authenticateStream();
    },

    async register() {
      this.error = '';
      this.isLoading = true;
      try {
        const session = await this.request('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password }),
        });
        this.setSession(session);
        await this.refreshAll();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    async login() {
      this.error = '';
      this.isLoading = true;
      try {
        const session = await this.request('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password }),
        });
        this.setSession(session);
        await this.refreshAll();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      this.account = null;
      this.positions = [];
      this.trades = [];
      localStorage.removeItem(TOKEN_KEY);
    },

    async hydrate() {
      if (!this.token) {
        await this.fetchLeaderboard();
        return;
      }

      try {
        const { user } = await this.request('/api/auth/me');
        this.user = user;
        this.attachRealtime();
        this.authenticateStream();
        await this.refreshAll();
      } catch {
        this.logout();
        await this.fetchLeaderboard();
      }
    },

    async refreshAll() {
      await Promise.all([
        this.fetchAccount(),
        this.fetchPositions(),
        this.fetchTrades(),
        this.fetchLeaderboard(),
      ]);
    },

    async fetchAccount() {
      if (!this.token) return;
      this.account = await this.request('/api/account');
    },

    async fetchPositions() {
      if (!this.token) return;
      this.positions = await this.request('/api/positions');
    },

    async fetchTrades() {
      if (!this.token) return;
      this.trades = await this.request('/api/trades');
    },

    async fetchLeaderboard() {
      this.leaderboard = await this.request('/api/leaderboard');
    },

    async placeOrder(symbol, type) {
      if (!this.token || !symbol) return;
      this.error = '';
      try {
        await this.request('/api/orders', {
          method: 'POST',
          body: JSON.stringify({
            symbol,
            type,
            quantity: Number(this.quantity),
          }),
        });
        await this.refreshAll();
      } catch (error) {
        this.error = error.message;
      }
    },

    async resetAccount() {
      if (!this.token) return;
      await this.request('/api/account/reset', {
        method: 'POST',
      });
      await this.refreshAll();
    },

    attachRealtime() {
      if (this.pnlHandler) return;

      this.pnlHandler = (message) => {
        const position = this.positions.find((item) => item.id === message.positionId);
        if (!position) return;
        position.currentPrice = message.price;
        position.pnl = message.pnl;
      };
      wsService.on('PNL_UPDATE', this.pnlHandler);
    },

    async authenticateStream() {
      if (!this.token) return;
      try {
        await wsService.send('authenticate', { token: this.token });
      } catch {
        // The REST trading flow still works if the stream reconnects later.
      }
    },
  },
});
