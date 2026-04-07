

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  tenantId: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (companyName: string, email: string, password: string) => Promise<boolean>;
  clearAuthError: () => void;
  isLoading: boolean;
  authError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);


  // Checa sessão no backend ao montar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await apiService.verifyToken();
        if (data && data.user) {
          setAuthError(null);
          setCurrentUser({
            id: data.user.id,
            email: data.user.email,
            tenantId: data.user.tenantId,
            // passwordHash não é retornado do backend
          });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        setCurrentUser(null);
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
      if (data && data.user) {
        setAuthError(null);
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          tenantId: data.user.tenantId,
        });
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
      if (data && data.user) {
        setAuthError(null);
        setCurrentUser({
          id: data.user.id,
          email: data.user.email,
          tenantId: data.user.tenantId,
        });
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
  };

  const clearAuthError = () => {
    setAuthError(null);
  };


  return (
    <AuthContext.Provider value={{ currentUser, tenantId: currentUser?.tenantId ?? null, login, logout, signup, clearAuthError, isLoading, authError }}>
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
