import { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, fetchMeApi } from '../features/auth/api/auth.api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cafe_woodys_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const initAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('cafe_woodys_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const staff = await fetchMeApi();
      setUser(staff);
      setToken(storedToken);
    } catch (err) {
      console.warn('Session restoration failed:', err.message);
      localStorage.removeItem('cafe_woodys_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const data = await loginApi(username, password);
      localStorage.setItem('cafe_woodys_token', data.token);
      setToken(data.token);
      setUser(data.staff);
      return data.staff;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cafe_woodys_token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
