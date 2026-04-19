import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('brokentrade_user');
      const storedToken = localStorage.getItem('brokentrade_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (e) {
      localStorage.removeItem('brokentrade_user');
      localStorage.removeItem('brokentrade_token');
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    console.log('[BT Auth] Login called with user:', userData);
    console.log('[BT Auth] Token:', authToken ? authToken.substring(0, 50) + '...' : 'null');
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('brokentrade_user', JSON.stringify(userData));
    localStorage.setItem('brokentrade_token', authToken);
    console.log('[BT Auth] Token stored in localStorage');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('brokentrade_user');
    localStorage.removeItem('brokentrade_token');
  };

  const navigateToPaperTrading = () => {
    console.log('[BT Auth] Navigate to Paper Trading called');
    console.log('[BT Auth] Token exists:', !!token);
    if (!token) {
      console.log('[BT Auth] No token, showing error');
      return { success: false, message: 'Please log in to access Paper Trading.' };
    }
    console.log('[BT Auth] Navigating to http://localhost:5174');
    window.location.href = 'http://localhost:5174';
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, navigateToPaperTrading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
