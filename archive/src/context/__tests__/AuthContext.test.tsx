import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';

// Mock useLocalStorage hook
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store, // Helper for testing
    _setStore: (newStore) => {
      store = newStore;
    }, // Helper for testing
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

jest.mock('../../hooks/useLocalStorage', () => {
  const React = require('react');
  return {
    useLocalStorage: jest.fn((key, initialValue) => {
      const storedValue = localStorageMock.getItem(key);
      const initial = storedValue ? JSON.parse(storedValue) : initialValue;
      const [value, setValue] = React.useState(initial);

      const setLocalValue = (newValue) => {
        setValue(newValue);
        localStorageMock.setItem(key, JSON.stringify(newValue));
      };
      return [value, setLocalValue];
    }),
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should provide default auth values', () => {
    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(auth).toBeDefined();
    expect(auth.currentUser).toBeNull();
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.logout).toBe('function');
    expect(typeof auth.signup).toBe('function');
  });

  it('should log in a user with correct credentials', async () => {
    localStorageMock.setItem('sored_users', JSON.stringify([
      { id: 'U-1', email: 'test@example.com', passwordHash: 'hashed_password123', tenantId: 'T-1' }
    ]));

    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    let loginSuccess;
    await act(async () => {
      loginSuccess = await auth.login('test@example.com', 'password123');
    });

    expect(loginSuccess).toBe(true);
    expect(localStorageMock.getItem('sored_session')).toEqual(JSON.stringify({ id: 'U-1', email: 'test@example.com', tenantId: 'T-1' }));
  });

  it('should not log in a user with incorrect password', async () => {
    localStorageMock.setItem('sored_users', JSON.stringify([
      { id: 'U-1', email: 'test@example.com', passwordHash: 'hashed_correct_password', tenantId: 'T-1' }
    ]));

    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    let loginSuccess;
    await act(async () => {
      loginSuccess = await auth.login('test@example.com', 'incorrect_password');
    });

    expect(loginSuccess).toBe(false);
    expect(localStorageMock.getItem('sored_session')).toBeNull();
  });

  it('should not log in a non-existent user', async () => {
    localStorageMock.setItem('sored_users', JSON.stringify([])); // No users in storage

    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    let loginSuccess;
    await act(async () => {
      loginSuccess = await auth.login('nonexistent@example.com', 'password123');
    });

    expect(loginSuccess).toBe(false);
    expect(localStorageMock.getItem('sored_session')).toBeNull();
  });

  it('should log out a user', async () => {
    const currentUser = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' };
    localStorageMock.setItem('sored_session', JSON.stringify(currentUser));

    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially, currentUser should be set
    expect(auth.currentUser).toEqual(currentUser);

    await act(async () => {
      await auth.logout();
    });

    // After logout, currentUser should be null
    expect(auth.currentUser).toBeNull();
  });

  it('should sign up a new user and tenant', async () => {
    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    let signupSuccess;
    await act(async () => {
      signupSuccess = await auth.signup('New Tenant', 'newuser@example.com', 'password123');
    });

    expect(signupSuccess).toBe(true);
    const users = JSON.parse(localStorageMock.getItem('sored_users') || '[]');
    const tenants = JSON.parse(localStorageMock.getItem('sored_tenants') || '[]');
    const session = JSON.parse(localStorageMock.getItem('sored_session') || 'null');

    expect(users.length).toBe(1);
    expect(tenants.length).toBe(1);
    expect(session).not.toBeNull();
    expect(users[0].email).toBe('newuser@example.com');
    expect(tenants[0].companyName).toBe('New Tenant');
    expect(session.email).toBe('newuser@example.com');
  });

  it('should not sign up a user with an existing email', async () => {
    const mockedConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const existingUser = { id: 'U-1', email: 'existing@example.com', passwordHash: 'hashed_password', tenantId: 'T-1' };
    localStorageMock.setItem('sored_users', JSON.stringify([existingUser]));

    let auth;
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    let signupSuccess;
    await act(async () => {
      signupSuccess = await auth.signup('Existing Tenant', 'existing@example.com', 'password123');
    });

    expect(signupSuccess).toBe(false);
    expect(mockedConsoleError).toHaveBeenCalledWith('User already exists');
    mockedConsoleError.mockRestore();

    const users = JSON.parse(localStorageMock.getItem('sored_users') || '[]');
    const tenants = JSON.parse(localStorageMock.getItem('sored_tenants') || '[]');
    const session = JSON.parse(localStorageMock.getItem('sored_session') || 'null');

    expect(users.length).toBe(1);
    expect(tenants.length).toBe(0);
    expect(localStorageMock.getItem('sored_session')).toBeNull();
  });
});
