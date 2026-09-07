import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// RF-21 — encerra a sessão automaticamente após inatividade (sem cliques,
// teclas, scroll ou toques), mesmo sem nenhuma chamada à API acontecer.
const INACTIVITY_TIMEOUT_MS = (Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 30) * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('edubot_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('edubot_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('edubot_user');
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('edubot_token', data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback((reason) => {
    localStorage.removeItem('edubot_token');
    if (reason) {
      localStorage.setItem('edubot_logout_reason', reason);
    }
    setUser(null);
  }, []);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    if (!user) return undefined;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => logoutRef.current('inactivity'), INACTIVITY_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
