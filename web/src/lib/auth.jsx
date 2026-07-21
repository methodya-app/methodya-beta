import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projectRoles, setProjectRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setProfile(data.profile);
      setIsAdmin(data.is_admin);
      setProjectRoles(data.project_roles || []);
    } catch {
      setProfile(null);
      setIsAdmin(false);
      setProjectRoles([]);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.access_token);
    setProfile(data.profile);
    setProjectRoles(data.project_roles || []);
    setIsAdmin(!!data.profile.is_admin);
    return data;
  };

  const logout = () => {
    setToken(null);
    setProfile(null);
    setIsAdmin(false);
    setProjectRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{ profile, isAdmin, projectRoles, loading, login, logout, refresh: loadMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
