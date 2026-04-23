import { useTradingStore } from '../stores/tradingStore';

// Use relative URL when served from same server
const BACKEND_URL = '';

/**
 * Centralized API client that automatically includes authentication token
 */
export async function apiRequest(path, options = {}) {
  const tradingStore = useTradingStore();
  
  // Sync token from auth store
  tradingStore.syncTokenFromAuth();
  
  // Build full URL
  const fullUrl = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  
  console.log('[API Client] Making request to:', fullUrl, 'with token:', tradingStore.token ? 'yes' : 'no');
  
  // Merge auth headers with provided headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add authorization header if token exists
  if (tradingStore.token) {
    headers['Authorization'] = `Bearer ${tradingStore.token}`;
  }
  
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Request failed.');
  }
  
  return data;
}
