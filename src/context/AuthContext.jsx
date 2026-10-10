import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// RF-21 — encerra a sessão automaticamente após inatividade (sem cliques,
// teclas, scroll ou toques), mesmo sem nenhuma chamada à API acontecer.
const INACTIVITY_TIMEOUT_MS = (Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 30) * 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

// Multi-escola — escola aberta pelo Administrador da plataforma. A API lê o
// mesmo valor (services/api.js) para mandar o cabeçalho X-School-Id. Fica no
// sessionStorage (por aba): duas abas podem ter escolas diferentes abertas sem
// uma trocar os dados da outra.
export const SCHOOL_STORAGE_KEY = 'edubot_school';

function readStoredSchool() {
  try {
    const stored = sessionStorage.getItem(SCHOOL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('edubot_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [platformSchool, setPlatformSchool] = useState(readStoredSchool);

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
      sessionStorage.removeItem(SCHOOL_STORAGE_KEY);
      setPlatformSchool(null);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback((reason) => {
    localStorage.removeItem('edubot_token');
    sessionStorage.removeItem(SCHOOL_STORAGE_KEY);
    if (reason) {
      localStorage.setItem('edubot_logout_reason', reason);
    }
    setPlatformSchool(null);
    setUser(null);
  }, []);

  // Administrador da plataforma: abre (ou fecha) o painel de uma escola.
  const selectSchool = useCallback((school) => {
    const value = { id: school.id, name: school.name };
    sessionStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(value));
    setPlatformSchool(value);
  }, []);

  const leaveSchool = useCallback(() => {
    sessionStorage.removeItem(SCHOOL_STORAGE_KEY);
    setPlatformSchool(null);
  }, []);

  // O login (token) é do navegador inteiro (localStorage). Se outra aba entra
  // com outra conta — de outra escola — ou sai, esta aba recarrega: a tela
  // nunca pode mostrar uma escola enquanto as chamadas já vão com o login de
  // outra.
  useEffect(() => {
    function handleStorage(e) {
      if (e.storageArea !== localStorage || !['edubot_token', 'edubot_user'].includes(e.key)) return;
      if (e.oldValue === e.newValue) return;
      window.location.reload();
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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

  const isPlatformAdmin = user?.role === 'super_admin';
  // Dentro de uma escola, o Administrador da plataforma pode o mesmo que o
  // Administrador dela.
  const isAdmin = user?.role === 'administrador' || isPlatformAdmin;
  const activeSchool = isPlatformAdmin
    ? platformSchool
    : user?.schoolId
      ? { id: user.schoolId, name: user.schoolName }
      : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin,
        isPlatformAdmin,
        activeSchool,
        selectSchool,
        leaveSchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
