

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';

type AccessStatus = 'trial' | 'paid' | 'grace' | 'blocked' | null;

interface AccessState {
  accessStatus: AccessStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  blockReason: string | null;
}

const normalizeUser = (user: any): User | null => {
  if (!user) return null;
  const id = user.id ?? user.userId ?? null;
  const email = user.email ?? null;
  const tenantId = user.tenantId ?? null;

  if (!id || !email || !tenantId) {
    return null;
  }

  return {
    id,
    email,
    tenantId,
  };
};

interface AuthContextType {
  currentUser: User | null;
  tenantId: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (companyName: string, email: string, password: string) => Promise<boolean>;
  clearAuthError: () => void;
  isLoading: boolean;
  authError: string | null;
  accessStatus: AccessStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  blockReason: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessState>({
    accessStatus: null,
    trialStartedAt: null,
    trialEndsAt: null,
    blockReason: null,
  });

  const applyAccess = (nextAccess: any) => {
    setAccess({
      accessStatus: nextAccess?.accessStatus ?? null,
      trialStartedAt: nextAccess?.trialStartedAt ?? null,
      trialEndsAt: nextAccess?.trialEndsAt ?? null,
      blockReason: nextAccess?.blockReason ?? null,
    });
  };


  // Checa sessão no backend ao montar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await apiService.verifyToken();
        const normalizedUser = normalizeUser(data?.user);
        if (normalizedUser) {
          setAuthError(null);
          applyAccess(data.access);
          setCurrentUser(normalizedUser);
        } else {
          setCurrentUser(null);
          applyAccess(null);
        }
      } catch (error) {
        setCurrentUser(null);
        applyAccess(null);
        if (error instanceof Error) {
          setAuthError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthError(null);
      const data = await apiService.login(email, password);
      const normalizedUser = normalizeUser(data?.user);
      if (normalizedUser) {
        setAuthError(null);
        applyAccess(data.access);
        setCurrentUser(normalizedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setAuthError(error.message);
      }
      return false;
    }
  };


  const signup = async (companyName: string, email: string, password: string): Promise<boolean> => {
    try {
      setAuthError(null);
      const data = await apiService.signup(companyName, email, password);
      const normalizedUser = normalizeUser(data?.user);
      if (normalizedUser) {
        setAuthError(null);
        applyAccess(data.access);
        setCurrentUser(normalizedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Error) {
        setAuthError(error.message);
      }
      return false;
    }
  };


  const logout = async () => {
    try {
      await apiService.logout();
    } catch {}
    setCurrentUser(null);
    setAuthError(null);
    applyAccess(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };


  return (
    <AuthContext.Provider value={{
      currentUser,
      tenantId: currentUser?.tenantId ?? null,
      login,
      logout,
      signup,
      clearAuthError,
      isLoading,
      authError,
      accessStatus: access.accessStatus,
      trialStartedAt: access.trialStartedAt,
      trialEndsAt: access.trialEndsAt,
      blockReason: access.blockReason,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
