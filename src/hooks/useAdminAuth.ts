import { useState, useEffect } from 'react';

const SESSION_KEY = 'bravos_admin_auth';
const CORRECT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'bravos2026';

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    setIsAuthenticated(stored === 'authenticated');
    setIsLoading(false);
  }, []);

  const login = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'authenticated');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout };
}
