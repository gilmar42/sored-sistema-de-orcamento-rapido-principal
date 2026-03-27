import '@testing-library/jest-dom';

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionModal from '../components/SubscriptionModal';
import * as paymentService from '../services/paymentService';

jest.mock('../services/paymentService');

const mockPlans = {
  monthlyPlan: { planType: 'monthly', price: 100 },
  annualPlan: { planType: 'annual', price: 1100 },
};


describe('SubscriptionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (paymentService.getPlans as jest.Mock).mockResolvedValue(mockPlans);
    // Mocka window.MercadoPago como construtor
    (window as any).MercadoPago = function () {
      return {
        createCardToken: jest.fn().mockResolvedValue({ id: 'tok_test' })
      };
    };
  });

  it('exibe planos e valida campos obrigatórios', async () => {
    render(<SubscriptionModal open={true} onClose={() => {}} />);
    expect(screen.getByText(/Assine um Plano/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Mensal R\$100/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Mensal R\$100/i));
    fireEvent.change(screen.getByPlaceholderText(/Seu e-mail/i), { target: { value: 'user@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Número do cartão/i), { target: { value: '4111111111111111' } });
    fireEvent.change(screen.getByPlaceholderText(/Nome impresso/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('MM/AA'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByPlaceholderText('CVV'), { target: { value: '123' } });
    (paymentService.createSubscription as jest.Mock).mockResolvedValue({ _id: 'subid' });
    fireEvent.click(screen.getByText(/Assinar/i));
    await waitFor(() => expect(screen.getByText(/Assinatura criada/i)).toBeInTheDocument());
  });

  it('exibe erro se campos faltando', async () => {
    render(<SubscriptionModal open={true} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Mensal R\$100/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Assinar/i));
    expect(screen.queryByText(/Assinatura criada/i)).not.toBeInTheDocument();
  });

  it('exibe mensagem de erro do backend', async () => {
    render(<SubscriptionModal open={true} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/Mensal R\$100/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Mensal R\$100/i));
    fireEvent.change(screen.getByPlaceholderText(/Seu e-mail/i), { target: { value: 'user@email.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Número do cartão/i), { target: { value: '4111111111111111' } });
    fireEvent.change(screen.getByPlaceholderText(/Nome impresso/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('MM/AA'), { target: { value: '12/30' } });
    fireEvent.change(screen.getByPlaceholderText('CVV'), { target: { value: '123' } });
    (paymentService.createSubscription as jest.Mock).mockRejectedValue({ message: 'Erro ao assinar' });
    fireEvent.click(screen.getByText(/Assinar/i));
    await waitFor(() => expect(screen.getByText(/Erro ao assinar/i)).toBeInTheDocument());
  });

  it('deve usar plano pré-selecionado quando fornecido', async () => {
    render(<SubscriptionModal open={true} onClose={() => {}} preSelectedPlan="annual" />);
    await waitFor(() => {
      // Verifica se o botão anual está selecionado
      const annualButton = screen.getByText(/Anual R\$1100/i);
      expect(annualButton).toHaveClass('bg-blue-500');
    });
  });
});
