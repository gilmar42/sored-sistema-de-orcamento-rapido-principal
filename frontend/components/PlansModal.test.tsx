import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlansModal from './PlansModal';
import * as paymentService from '../services/paymentService';

// Mock do serviço de pagamento
jest.mock('../services/paymentService');

describe('PlansModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por padrão, fazer getPlans falhar para usar os planos padrão
    (paymentService.getPlans as jest.Mock).mockRejectedValue(new Error('API not available'));
  });

  it('deve renderizar o modal quando open=true', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    expect(screen.getByText('Escolha seu Plano')).toBeInTheDocument();
    // Aguardar os planos padrão carregarem
    await waitFor(() => {
      expect(screen.getByText('Plano Mensal')).toBeInTheDocument();
    });
  });

  it('não deve renderizar quando open=false', () => {
    render(<PlansModal open={false} onClose={() => {}} />);
    expect(screen.queryByText('Escolha seu Plano')).not.toBeInTheDocument();
  });

  it('deve exibir planos padrão quando API falha', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText('Plano Mensal')).toBeInTheDocument();
      expect(screen.getByText('Plano Anual')).toBeInTheDocument();
    });
  });

  it('deve exibir os recursos de cada plano', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      const body = document.body.textContent || '';
      expect(body).toContain('ilimitados');
      expect(body).toContain('materiais');
      expect(body).toContain('clientes');
    });
  });

  it('deve destacar o plano anual como popular', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText(/MAIS POPULAR/i)).toBeInTheDocument();
    });
  });

  it('deve exibir preços corretos', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      // Buscar por partes do texto ao invés do texto completo
      const body = document.body.textContent || '';
      expect(body).toMatch(/R\$\s*100/);
      expect(body).toMatch(/R\$\s*1100/);
    });
  });

  it('deve chamar onClose quando botão fechar é clicado', async () => {
    const onClose = jest.fn();
    render(<PlansModal open={true} onClose={onClose} />);
    
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Fechar');
      fireEvent.click(closeButton);
    });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('deve exibir loading ao carregar planos', () => {
    (paymentService.getPlans as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<PlansModal open={true} onClose={() => {}} />);
    
    // Loading spinner deve estar presente
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('deve exibir economia no plano anual', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Economia/i)).toBeInTheDocument();
    });
  });

  it('deve exibir preço mensal equivalente no plano anual', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Equivalente a/i)).toBeInTheDocument();
    });
  });

  it('deve ter botões de assinatura para cada plano', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      // Verificar se os textos aparecem no documento
      const body = document.body.textContent || '';
      expect(body).toContain('Assinar');
      expect(body).toContain('Cartão');
      expect(body).toContain('Pagar com Pix');
      expect(body).toContain('Plano Mensal');
      expect(body).toContain('Plano Anual');
    });
  });

  it('deve exibir informações de segurança', async () => {
    render(<PlansModal open={true} onClose={() => {}} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Pagamento seguro/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancele a qualquer momento/i)).toBeInTheDocument();
    });
  });
});
