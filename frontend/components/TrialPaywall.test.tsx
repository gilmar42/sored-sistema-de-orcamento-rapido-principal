import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrialPaywall from './TrialPaywall';

describe('TrialPaywall', () => {
  it('renderiza a mensagem de bloqueio e o CTA de assinatura', () => {
    render(<TrialPaywall onSubscribe={() => {}} onTryAnotherAccount={() => {}} />);

    expect(screen.getByText(/Seu acesso foi pausado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ativar assinatura agora/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar com outra conta/i })).toBeInTheDocument();
  });

  it('chama onSubscribe quando o CTA principal é clicado', () => {
    const onSubscribe = jest.fn();
    render(<TrialPaywall onSubscribe={onSubscribe} onTryAnotherAccount={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Ativar assinatura agora/i }));

    expect(onSubscribe).toHaveBeenCalledTimes(1);
  });
});
