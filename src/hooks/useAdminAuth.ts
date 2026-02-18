import { useState, useEffect } from 'react';

// ── Storage keys ────────────────────────────────────────────
const STORAGE_KEY = 'admin_token';
const EXPIRES_KEY = 'admin_token_expires_at';

// ── TTL: 12 hours ───────────────────────────────────────────
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

// ── Standalone helpers (usable outside React components) ────

/** Read the admin token, respecting TTL. Returns null if missing or expired. */
export function getAdminToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return null;

    const expiresAt = localStorage.getItem(EXPIRES_KEY);
    if (!expiresAt || Date.now() > Number(expiresAt)) {
      // Expired or missing expiry → treat as expired (security-first)
      clearAdminToken();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/** Persist admin token with TTL. */
export function setAdminToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(EXPIRES_KEY, String(Date.now() + ADMIN_TOKEN_TTL_MS));
  } catch {
    // quota exceeded, etc.
  }
}

/** Remove admin token and expiry. */
export function clearAdminToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  } catch {
    // ignore
  }
}

// ── React hook ──────────────────────────────────────────────

interface UseAdminAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => boolean;
  logout: () => void;
  token: string;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = getAdminToken();
    if (saved) {
      setToken(saved);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (password: string): boolean => {
    if (!password.trim()) {
      setError('Digite o token de acesso.');
      return false;
    }
    const trimmed = password.trim();
    setAdminToken(trimmed);
    setToken(trimmed);
    setIsAuthenticated(true);
    setError(null);
    return true;
  };

  const logout = () => {
    clearAdminToken();
    setToken('');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, error, login, logout, token };
}
