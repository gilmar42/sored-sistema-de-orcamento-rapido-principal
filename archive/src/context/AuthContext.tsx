
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { User, Tenant } from '../types';

// Simplified hashing for simulation purposes.
// In a real application, use a robust library like bcrypt.
const pseudoHash = (password: string) => `hashed_${password}`;

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (companyName: string, email: string, password: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('sored_users', []);
  const [tenants, setTenants] = useLocalStorage<Tenant[]>('sored_tenants', []);
  const [session, setSession] = useLocalStorage<User | null>('sored_session', null);

  // TODO: Remover após a depuração (task: debug_auth_context)
  // const debugUser: User = {
  //     id: 'U-debug',
  //     email: 'debug@example.com',
  //     passwordHash: pseudoHash('password'),
  //     tenantId: 'T-debug',
  // };
  // const currentUser = debugUser; // Forçando um usuário para depuração
  const currentUser = session; // Linha original

  const login = async (email: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    const passwordHash = pseudoHash(password);
    
    if (user && user.passwordHash === passwordHash) {
      const { passwordHash, ...sessionUser } = user;
      setSession(sessionUser);
      return true;
    }
    return false;
  };

  const signup = async (companyName: string, email: string, password: string): Promise<boolean> => {
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      console.error("User already exists");
      return false;
    }

    const newTenant: Tenant = { id: `T-${Date.now()}`, companyName };
    setTenants([...tenants, newTenant]);

    const newUser: User = {
      id: `U-${Date.now()}`,
      email: email,
      passwordHash: pseudoHash(password),
      tenantId: newTenant.id,
    };
    setUsers([...users, newUser]);

    setSession(newUser);
    return true;
  };

  const logout = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, signup }}>
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
