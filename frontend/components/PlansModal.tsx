import React, { useState, useEffect } from 'react';
import { getPlans, createPixPayment, getPixPaymentStatus } from '../services/paymentService';
import SubscriptionModal from './SubscriptionModal';

interface PlansModalProps {
  open: boolean;
  onClose: () => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'annual';
  features: string[];
  popular?: boolean;
}

const PlansModal: React.FC<PlansModalProps> = ({ open, onClose }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const [pixPlan, setPixPlan] = useState<'monthly' | 'annual' | null>(null);
  const [pixEmail, setPixEmail] = useState('');
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ paymentId: string; status: string; qrCode: string | null; qrCodeBase64: string | null; expiresAt?: string | null } | null>(null);
  const [pixStatusChecking, setPixStatusChecking] = useState(false);

  // Planos padrão caso a API não esteja disponível
  const defaultPlans: Plan[] = [
    {
      id: 'monthly',
      name: 'Plano Mensal',
      price: 100,
      interval: 'monthly',
      features: [
        'Orçamentos ilimitados',
        'Gerenciamento de materiais',
        'Gestão de clientes',
        'Exportação em PDF',
        'Suporte por email',
      ],
    },
    {
      id: 'annual',
      name: 'Plano Anual',
      price: 1100,
      interval: 'annual',
      popular: true,
      features: [
        'Orçamentos ilimitados',
        'Gerenciamento de materiais',
        'Gestão de clientes',
        'Exportação em PDF',
        'Suporte prioritário',
        'Economia de R$ 100/ano',
        'Relatórios avançados',
      ],
    },
  ];

  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPlans();
      if (data && Array.isArray(data) && data.length > 0) {
        setPlans(data);
      } else {
        // API retornou vazio, usar planos padrão
        setPlans(defaultPlans);
      }
    } catch (err) {
      // Erro na API, usar planos padrão (sem mostrar erro ao usuário)
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planType: 'monthly' | 'annual') => {
    setSelectedPlan(planType);
    setShowSubscription(true);
  };

  const handlePixOpen = (planType: 'monthly' | 'annual') => {
    setPixPlan(planType);
    setPixOpen(true);
    setPixError(null);
    setPixData(null);
  };

  const handlePixClose = () => {
    setPixOpen(false);
    setPixPlan(null);
    setPixEmail('');
    setPixError(null);
    setPixData(null);
    setPixStatusChecking(false);
  };

  const handleCreatePix = async () => {
    if (!pixPlan) return;
    if (!pixEmail) {
      setPixError('Informe um e-mail para gerar o Pix.');
      return;
    }
    setPixLoading(true);
    setPixError(null);
    try {
      const result = await createPixPayment({ email: pixEmail, planType: pixPlan });
      setPixData(result);
    } catch (err: any) {
      setPixError(err?.message || 'Erro ao gerar Pix.');
    } finally {
      setPixLoading(false);
    }
  };

  const handleCheckPixStatus = async () => {
    if (!pixData?.paymentId) return;
    setPixStatusChecking(true);
    setPixError(null);
    try {
      const status = await getPixPaymentStatus(pixData.paymentId);
      if (status.status === 'approved') {
        window.location.href = `${window.location.pathname}?payment=success`;
        return;
      }
      if (status.status === 'pending' || status.status === 'in_process') {
        setPixError('Pagamento ainda pendente. Aguarde alguns instantes.');
      } else {
        setPixError('Pagamento não aprovado.');
      }
    } catch (err: any) {
      setPixError(err?.message || 'Erro ao verificar pagamento.');
    } finally {
      setPixStatusChecking(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
    } catch {
      setPixError('Não foi possível copiar o código Pix.');
    }
  };

  const handleCloseSubscription = () => {
    setShowSubscription(false);
    setSelectedPlan(null);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Escolha seu Plano
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Selecione o plano que melhor atende suas necessidades
            </p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadPlans}
                  className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                      plan.popular
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          MAIS POPULAR
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                          R$ {plan.price}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                          /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </div>
                      {plan.interval === 'annual' && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Equivalente a R$ {Math.round(plan.price / 12)}/mês
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-green-500 dark:text-green-400 mr-2 mt-0.5 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleSelectPlan(plan.interval)}
                        className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                          plan.popular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                        }`}
                      >
                        Assinar {plan.name} (Cartão)
                      </button>
                      <button
                        onClick={() => handlePixOpen(plan.interval)}
                        className="w-full py-3 px-6 rounded-lg font-semibold transition-all bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                      >
                        Pagar com Pix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                🔒 Pagamento seguro via Mercado Pago • Cancele a qualquer momento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de assinatura */}
      <SubscriptionModal
        open={showSubscription}
        onClose={handleCloseSubscription}
        preSelectedPlan={selectedPlan}
      />

      {pixOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pagamento via Pix</h3>
              <button
                onClick={handlePixClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Plano selecionado: {pixPlan === 'annual' ? 'Anual' : 'Mensal'}
            </p>

            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" htmlFor="pix-email">
              E-mail para o Pix
            </label>
            <input
              id="pix-email"
              type="email"
              value={pixEmail}
              onChange={(e) => setPixEmail(e.target.value)}
              className="w-full mb-3 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="seu@email.com"
            />

            <button
              onClick={handleCreatePix}
              disabled={pixLoading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold disabled:opacity-60"
            >
              {pixLoading ? 'Gerando Pix...' : 'Gerar Pix'}
            </button>

            {pixData?.qrCodeBase64 && (
              <div className="mt-6 text-center">
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="mx-auto w-48 h-48"
                />
                <div className="mt-4">
                  <textarea
                    readOnly
                    value={pixData.qrCode || ''}
                    className="w-full h-24 p-2 border rounded text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                  >
                    Copiar código Pix
                  </button>
                </div>
                <button
                  onClick={handleCheckPixStatus}
                  disabled={pixStatusChecking}
                  className="mt-3 w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded font-semibold disabled:opacity-60"
                >
                  {pixStatusChecking ? 'Verificando...' : 'Já paguei, verificar'}
                </button>
              </div>
            )}

            {pixError && <p className="text-red-600 text-sm mt-3">{pixError}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default PlansModal;
