import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth.js';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    window.location.href = '';
    vi.clearAllMocks();
  });

  describe('loadFromStorage', () => {
    it('should retrieve token and user from localStorage', () => {
      // Arrange
      const mockToken = 'test-jwt-token';
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      localStorage.setItem('brokentrade_token', mockToken);
      localStorage.setItem('brokentrade_user', JSON.stringify(mockUser));

      // Act
      const store = useAuthStore();
      store.loadFromStorage();

      // Assert
      expect(store.token).toBe(mockToken);
      expect(store.user).toEqual(mockUser);
      expect(store.loading).toBe(false);
    });

    it('should not set token or user if localStorage is empty', () => {
      // Act
      const store = useAuthStore();
      store.loadFromStorage();

      // Assert
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(store.loading).toBe(false);
    });

    it('should handle invalid JSON in localStorage', () => {
      // Arrange
      localStorage.setItem('brokentrade_token', 'test-token');
      localStorage.setItem('brokentrade_user', 'invalid-json{');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const store = useAuthStore();
      store.loadFromStorage();

      // Assert
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(store.loading).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(localStorage.getItem('brokentrade_token')).toBeNull();
      expect(localStorage.getItem('brokentrade_user')).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should only set values if both token and user exist', () => {
      // Arrange - only token, no user
      localStorage.setItem('brokentrade_token', 'test-token');

      // Act
      const store = useAuthStore();
      store.loadFromStorage();

      // Assert
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should call backend with correct Authorization header', async () => {
      // Arrange
      const mockToken = 'test-jwt-token';
      const mockUser = { id: '123', name: 'Test User', email: 'test@example.com' };
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ valid: true, user: mockUser }),
      });

      const store = useAuthStore();
      store.token = mockToken;

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/auth/verify',
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toBe(true);
      expect(store.user).toEqual(mockUser);
      expect(store.error).toBe('');
    });

    it('should redirect to login if no token exists', async () => {
      // Arrange
      const store = useAuthStore();
      store.token = null;

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(result).toBe(false);
      expect(store.error).toBe('Please log in to access Paper Trading.');
      expect(window.location.href).toContain('http://localhost:5173/login?message=Please');
      expect(window.location.href).toContain('Paper+Trading');
    });

    it('should handle TOKEN_EXPIRED error', async () => {
      // Arrange
      const mockToken = 'expired-token';
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired',
          },
        }),
      });

      const store = useAuthStore();
      store.token = mockToken;
      localStorage.setItem('brokentrade_token', mockToken);

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(result).toBe(false);
      expect(store.error).toBe('Your session has expired. Please log in again.');
      expect(store.token).toBeNull();
      expect(localStorage.getItem('brokentrade_token')).toBeNull();
      expect(window.location.href).toContain('http://localhost:5173/login');
    });

    it('should handle INVALID_TOKEN error', async () => {
      // Arrange
      const mockToken = 'invalid-token';
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid token signature',
          },
        }),
      });

      const store = useAuthStore();
      store.token = mockToken;

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(result).toBe(false);
      expect(store.error).toBe('Your session has expired. Please log in again.');
    });

    it('should handle USER_NOT_FOUND error', async () => {
      // Arrange
      const mockToken = 'token-with-missing-user';
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        }),
      });

      const store = useAuthStore();
      store.token = mockToken;

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(result).toBe(false);
      expect(store.error).toBe('Your session has expired. Please log in again.');
    });

    it('should handle network errors', async () => {
      // Arrange
      const mockToken = 'test-token';
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const store = useAuthStore();
      store.token = mockToken;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(result).toBe(false);
      expect(store.error).toBe('Unable to connect to the server. Please check your connection.');
      expect(store.token).toBeNull();
      expect(window.location.href).toContain('http://localhost:5173/login');

      consoleErrorSpy.mockRestore();
    });

    it('should handle generic errors', async () => {
      // Arrange
      const mockToken = 'test-token';
      global.fetch = vi.fn().mockRejectedValue(new Error('Something went wrong'));

      const store = useAuthStore();
      store.token = mockToken;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const result = await store.verifyToken();

      // Assert
      expect(result).toBe(false);
      expect(store.error).toBe('Authentication failed. Please log in again.');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect to login', () => {
      // Arrange
      const mockToken = 'test-token';
      const mockUser = { id: '123', name: 'Test User' };
      localStorage.setItem('brokentrade_token', mockToken);
      localStorage.setItem('brokentrade_user', JSON.stringify(mockUser));

      const store = useAuthStore();
      store.token = mockToken;
      store.user = mockUser;

      // Act
      store.logout();

      // Assert
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.getItem('brokentrade_token')).toBeNull();
      expect(localStorage.getItem('brokentrade_user')).toBeNull();
      expect(window.location.href).toContain('http://localhost:5173/login?message=You');
      expect(window.location.href).toContain('logged+out');
    });

    it('should work even if localStorage is already empty', () => {
      // Arrange
      const store = useAuthStore();

      // Act
      store.logout();

      // Assert
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(window.location.href).toContain('http://localhost:5173/login');
    });
  });

  describe('checkBackendAvailability', () => {
    it('should return true when backend responds with ok status', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      const store = useAuthStore();

      // Act
      const result = await store.checkBackendAvailability();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5001/api/auth/health');
      expect(result).toBe(true);
    });

    it('should return false when backend responds with error status', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const store = useAuthStore();

      // Act
      const result = await store.checkBackendAvailability();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when fetch throws network error', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const store = useAuthStore();

      // Act
      const result = await store.checkBackendAvailability();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when backend is unreachable', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const store = useAuthStore();

      // Act
      const result = await store.checkBackendAvailability();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isAuthenticated computed', () => {
    it('should return true when token exists', () => {
      // Arrange
      const store = useAuthStore();
      store.token = 'test-token';

      // Assert
      expect(store.isAuthenticated).toBe(true);
    });

    it('should return false when token is null', () => {
      // Arrange
      const store = useAuthStore();
      store.token = null;

      // Assert
      expect(store.isAuthenticated).toBe(false);
    });

    it('should return false when token is empty string', () => {
      // Arrange
      const store = useAuthStore();
      store.token = '';

      // Assert
      expect(store.isAuthenticated).toBe(false);
    });
  });
});
