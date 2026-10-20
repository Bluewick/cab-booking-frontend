import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import userService from '../services/user.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('urbancab_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('urbancab_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem('urbancab_token', newToken);
    } else {
      localStorage.removeItem('urbancab_token');
    }
    if (newUser) {
      localStorage.setItem('urbancab_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('urbancab_user');
    }
  }, []);

  const logout = useCallback(() => {
    persistSession(null, null);
  }, [persistSession]);

  // Initial session hydration & backend profile verification
  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const storedToken = localStorage.getItem('urbancab_token');
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const freshUser = await userService.getMe();
        if (isMounted) {
          setUser(freshUser);
          localStorage.setItem('urbancab_user', JSON.stringify(freshUser));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        if (isMounted) logout();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSession();

    // Listen to 401 unauthorized broadcasts from api.js interceptor
    const handleUnauthorized = () => logout();
    window.addEventListener('urbancab:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('urbancab:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    persistSession(data.token, data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    persistSession(data.token, data.user);
    return data;
  };

  const syncClerkUser = async (clerkPayload) => {
    const data = await authService.syncClerk(clerkPayload);
    persistSession(data.token, data.user);
    return data;
  };

  const updateProfile = async (updates) => {
    const updatedUser = await userService.updateMe(updates);
    setUser(updatedUser);
    localStorage.setItem('urbancab_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    syncClerkUser,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
