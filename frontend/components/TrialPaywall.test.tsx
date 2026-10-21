import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrialPaywall from './TrialPaywall';

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    refreshAccess: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe('TrialPaywall', () => {
  it('renderiza a mensagem de bloqueio e o CTA de assinatura', () => {
    render(<TrialPaywall onSubscribe={() => {}} onGoHome={() => {}} />);

    expect(screen.getByText(/Seu acesso foi pausado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ativar assinatura agora/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Voltar para o Início/i })).toBeInTheDocument();
  });

  it('chama onSubscribe quando o CTA principal é clicado', () => {
    const onSubscribe = jest.fn();
    render(<TrialPaywall onSubscribe={onSubscribe} onGoHome={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Ativar assinatura agora/i }));

    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });
});
