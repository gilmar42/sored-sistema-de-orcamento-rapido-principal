import { render, act, waitFor } from '@testing-library/react';
// import duplicado removido
// import React removido, não utilizado

// Mock apiService
jest.mock('../../services/api', () => {
  return {
    apiService: {
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      verifyToken: jest.fn(),
    },
  };
});

describe('AuthContext', () => {
  const { apiService } = require('../../services/api');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide default auth values', () => {
    let auth: any;
    apiService.verifyToken.mockResolvedValue({});
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
    const user = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1', passwordHash: 'hashed' };
    apiService.login.mockResolvedValue({ user });
    apiService.verifyToken.mockResolvedValueOnce({});
    let authInstance;
    function TestComponent() {
      const auth = useAuth();
      authInstance = auth;
      return null;
    }
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    let loginSuccess;
    await act(async () => {
      loginSuccess = await authInstance.login('test@example.com', 'password123');
    });
    await waitFor(() => {
      expect(authInstance.currentUser).toEqual({ id: user.id, email: user.email, tenantId: user.tenantId });
    });
    expect(loginSuccess).toBe(true);
  });

  it('should not log in a user with incorrect credentials', async () => {
    let auth: any;
    apiService.login.mockResolvedValue({});
    apiService.verifyToken.mockResolvedValue({});
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
      loginSuccess = await auth.login('test@example.com', 'wrongpassword');
    });
    expect(loginSuccess).toBe(false);
    expect(auth.currentUser).toBeNull();
  });

  it('should log out a user', async () => {
    let auth: any;
    const user = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1', passwordHash: 'hashed' };
    apiService.verifyToken.mockResolvedValue({ user });
    apiService.logout.mockResolvedValue({});
    const TestComponent = () => {
      auth = useAuth();
      return null;
    };
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    // Simula login
    act(() => {
      auth.currentUser = user;
    });
    await act(async () => {
      await auth.logout();
    });
    expect(auth.currentUser).toBeNull();
  });

  it('should sign up a new user and tenant', async () => {
    const user = { id: 'U-2', email: 'newuser@example.com', tenantId: 'T-2', passwordHash: 'hashed' };
    apiService.signup.mockResolvedValue({ user });
    apiService.verifyToken.mockResolvedValueOnce({});
    let authInstance;
    function TestComponent() {
      const auth = useAuth();
      authInstance = auth;
      return null;
    }
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    let signupSuccess;
    await act(async () => {
      signupSuccess = await authInstance.signup('New Tenant', 'newuser@example.com', 'password123');
    });
    await waitFor(() => {
      expect(authInstance.currentUser).toEqual({ id: user.id, email: user.email, tenantId: user.tenantId });
    });
    expect(signupSuccess).toBe(true);
  });

  it('should not sign up a user with an existing email', async () => {
    let auth: any;
    apiService.signup.mockResolvedValue({});
    apiService.verifyToken.mockResolvedValue({});
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
    expect(auth.currentUser).toBeNull();
  });
});
// import duplicado removido


import { AuthProvider, useAuth } from '../AuthContext';
import React from 'react';


// Mock apiService
jest.mock('../../services/api', () => {
  return {
    apiService: {
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      verifyToken: jest.fn(),
    },
  };

});
