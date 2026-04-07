import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrialStatusBanner from './TrialStatusBanner';

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    accessStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  }),
}));

describe('TrialStatusBanner', () => {
  it('shows trial countdown and CTA', () => {
    render(<TrialStatusBanner onOpenPlans={() => {}} />);

    expect(screen.getByText(/teste gratuito ativo/i)).toBeInTheDocument();
    expect(screen.getByText(/Seu teste grátis termina em/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver planos agora/i })).toBeInTheDocument();
  });
});
