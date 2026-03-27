import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainLayout } from '../components/MainLayout';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';

// Mock do useAuth para simular um usuário autenticado
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => ({
    currentUser: { uid: 'test-uid', email: 'test@example.com', tenantId: 'test-tenant' },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    loading: false,
    error: null,
  }),
}));

describe('MainLayout', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </AuthProvider>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});