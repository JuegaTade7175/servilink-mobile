import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, Role } from '../types';

interface AuthContextType {
  token: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEYS = {
  token:  'sl_token',
  userId: 'sl_userId',
  name:   'sl_name',
  email:  'sl_email',
  role:   'sl_role',
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,     setToken]     = useState<string | null>(null);
  const [userId,    setUserId]    = useState<number | null>(null);
  const [userName,  setUserName]  = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role,      setRole]      = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStorage() {
      try {
        const [[, t], [, u], [, n], [, e], [, r]] = await AsyncStorage.multiGet([
          KEYS.token, KEYS.userId, KEYS.name, KEYS.email, KEYS.role
        ]);
        setToken(t);
        setUserId(u ? Number(u) : null);
        setUserName(n);
        setUserEmail(e);
        setRole(r as Role | null);
      } catch (err) {
        console.error('Error loading auth state', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorage();
  }, []);

  const login = useCallback(async (data: AuthResponse) => {
    try {
      await AsyncStorage.multiSet([
        [KEYS.token,  data.token],
        [KEYS.userId, String(data.userId)],
        [KEYS.name,   data.name],
        [KEYS.email,  data.email],
        [KEYS.role,   data.role],
      ]);
      setToken(data.token);
      setUserId(data.userId);
      setUserName(data.name);
      setUserEmail(data.email);
      setRole(data.role);
    } catch (err) {
      console.error('Error saving auth state', err);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      setToken(null);
      setUserId(null);
      setUserName(null);
      setUserEmail(null);
      setRole(null);
    } catch (err) {
      console.error('Error clearing auth state', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      token, userId, userName, userEmail, role,
      isAuthenticated: !!token,
      isLoading,
      login, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
