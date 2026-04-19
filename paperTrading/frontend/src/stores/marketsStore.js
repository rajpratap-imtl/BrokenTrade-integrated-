import { defineStore } from 'pinia';
import { apiRequest } from '../utils/apiClient';

export const useMarketsStore = defineStore('markets', {
  state: () => ({
    all: [],
  }),

  actions: {
    async fetch() {
      try {
        const data = await apiRequest('/api/data-accessor/markets');
        this.all = data;
      } catch (err) {
        console.error('Failed to fetch markets:', err);
      }
    },
  },
});
