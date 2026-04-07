import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('../../services/api', () => ({
  apiService: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    verifyToken: jest.fn(),
  },
}));

describe('AuthContext', () => {
  const { apiService } = require('../../services/api');

  const renderAuth = async () => {
    let auth: any;
    const TestComponent = () => {
      auth = useAuth();
      return (
        <div data-testid="auth-state">
          {auth.currentUser ? auth.currentUser.email : 'none'}|{auth.isLoading ? 'loading' : 'ready'}
        </div>
      );
    };

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    return { auth };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide default auth values', async () => {
    apiService.verifyToken.mockResolvedValue({});

    const { auth } = await renderAuth();

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('none|ready'));
    expect(typeof auth.login).toBe('function');
    expect(typeof auth.logout).toBe('function');
    expect(typeof auth.signup).toBe('function');
  });

  it('should log in a user with correct credentials', async () => {
    const user = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1', passwordHash: 'hashed' };
    apiService.login.mockResolvedValue({ user });
    apiService.verifyToken.mockResolvedValue({});

    const { auth } = await renderAuth();

    let loginSuccess = false;
    await act(async () => {
      loginSuccess = await auth.login('test@example.com', 'password123');
    });

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent(user.email));
    expect(loginSuccess).toBe(true);
  });

  it('should not log in a user with incorrect credentials', async () => {
    apiService.login.mockResolvedValue({});
    apiService.verifyToken.mockResolvedValue({});

    const { auth } = await renderAuth();

    let loginSuccess = true;
    await act(async () => {
      loginSuccess = await auth.login('test@example.com', 'wrongpassword');
    });

    expect(loginSuccess).toBe(false);
    expect(screen.getByTestId('auth-state')).toHaveTextContent('none');
  });

  it('should log out a user', async () => {
    const user = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1', passwordHash: 'hashed' };
    apiService.verifyToken.mockResolvedValue({});
    apiService.login.mockResolvedValue({ user });
    apiService.logout.mockResolvedValue({});

    const { auth } = await renderAuth();

    await act(async () => {
      await auth.login('test@example.com', 'password123');
    });

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent(user.email));

    await act(async () => {
      await auth.logout();
    });

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('none|ready'));
  });

  it('should sign up a new user and tenant', async () => {
    const user = { id: 'U-2', email: 'newuser@example.com', tenantId: 'T-2', passwordHash: 'hashed' };
    apiService.signup.mockResolvedValue({ user });
    apiService.verifyToken.mockResolvedValue({});

    const { auth } = await renderAuth();

    let signupSuccess = false;
    await act(async () => {
      signupSuccess = await auth.signup('New Tenant', 'newuser@example.com', 'password123');
    });

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent(user.email));
    expect(signupSuccess).toBe(true);
  });

  it('should not sign up a user with an existing email', async () => {
    apiService.signup.mockResolvedValue({});
    apiService.verifyToken.mockResolvedValue({});

    const { auth } = await renderAuth();

    let signupSuccess = true;
    await act(async () => {
      signupSuccess = await auth.signup('Existing Tenant', 'existing@example.com', 'password123');
    });

    expect(signupSuccess).toBe(false);
    expect(screen.getByTestId('auth-state')).toHaveTextContent('none');
  });
});
