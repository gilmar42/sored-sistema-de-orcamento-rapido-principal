import React, { useState, useRef } from 'react';
import { getPlans, createSubscription } from '@/services/paymentService';
import { useMercadoPago } from '@/hooks/useMercadoPago';

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  preSelectedPlan?: 'monthly' | 'annual' | null;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ open, onClose, preSelectedPlan = null }) => {
  const [plans, setPlans] = useState<any>(null);
  const [selected, setSelected] = useState<'monthly' | 'annual' | null>(preSelectedPlan);
  const [email, setEmail] = useState('');
  const [cardToken, setCardToken] = useState('');
  const [card, setCard] = useState({
    number: '',
    holder: '',
    exp: '',
    cvv: '',
    docType: 'CPF',
    docNumber: '',
  });
  const mpKey = (import.meta.env.VITE_MP_PUBLIC_KEY || (window as any).VITE_MP_PUBLIC_KEY || '') as string;
  console.log(`[SubscriptionModal] MP Key status: ${mpKey ? 'Present (' + mpKey.slice(0, 10) + '...)' : 'MISSING'}`);
  const mp = useMercadoPago(mpKey);
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      // Buscar planos da API, mas não mostrar erro se falhar
      getPlans().then(setPlans).catch(() => {
        // Silenciosamente falhar - os botões ainda funcionam
        setPlans(null);
      });
      // Se recebeu um plano pré-selecionado, usar ele
      if (preSelectedPlan) {
        setSelected(preSelectedPlan);
      }
    } else {
      // Limpar erro quando fechar
      setError(null);
      setResult(null);
    }
  }, [open, preSelectedPlan]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      // Tokenização real
      if (!mp) throw new Error('Mercado Pago SDK não carregado');
      const [exp_month, exp_year] = card.exp.split('/').map(s => s.trim());
      const tokenResult = await mp.createCardToken({
        cardNumber: card.number.replace(/\s+/g, ''),
        cardholderName: card.holder,
        securityCode: card.cvv,
        cardExpirationMonth: exp_month,
        cardExpirationYear: exp_year.length === 2 ? `20${exp_year}` : exp_year, // MP prefers 4-digit year typically
        identificationType: card.docType,
        identificationNumber: card.docNumber.replace(/\D/g, ''),
      });
      if (!tokenResult.id) throw new Error('Erro ao tokenizar cartão');
      setCardToken(tokenResult.id);
      const res = await createSubscription({ email, token: tokenResult.id, planType: selected! });
      setResult(res);
      // Recarregar após 2 segundos para liberar o acesso
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Erro ao assinar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Assine um Plano</h2>
        {plans ? (
          <div className="mb-4">
            <button className={`mr-2 px-4 py-2 rounded ${selected==='monthly'?'bg-blue-500 text-white':'bg-gray-200'}`} onClick={()=>setSelected('monthly')}>Mensal R$100</button>
            <button className={`px-4 py-2 rounded ${selected==='annual'?'bg-blue-500 text-white':'bg-gray-200'}`} onClick={()=>setSelected('annual')}>Anual R$1100</button>
          </div>
        ) : <div>Carregando planos...</div>}
        <input className="w-full mb-2 p-2 border rounded" placeholder="Seu e-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        {/* Campos reais de cartão */}
        <input className="w-full mb-2 p-2 border rounded" placeholder="Número do cartão" value={card.number} onChange={e=>setCard(c=>({...c,number:e.target.value}))} maxLength={16} />
        <input className="w-full mb-2 p-2 border rounded" placeholder="Nome impresso no cartão" value={card.holder} onChange={e=>setCard(c=>({...c,holder:e.target.value}))} />
        <div className="flex gap-2">
          <input className="w-1/2 mb-2 p-2 border rounded" placeholder="MM/AA" value={card.exp} onChange={e=>setCard(c=>({...c,exp:e.target.value}))} maxLength={5} />
          <input className="w-1/2 mb-2 p-2 border rounded" placeholder="CVV" value={card.cvv} onChange={e=>setCard(c=>({...c,cvv:e.target.value}))} maxLength={4} />
        </div>
        <div className="flex gap-2">
          <select className="w-1/3 mb-2 p-2 border rounded" value={card.docType} onChange={e=>setCard(c=>({...c,docType:e.target.value}))}>
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </select>
          <input className="w-2/3 mb-2 p-2 border rounded" placeholder={`Número do ${card.docType}`} value={card.docNumber} onChange={e=>setCard(c=>({...c,docNumber:e.target.value}))} maxLength={18} />
        </div>
        <button className="w-full bg-green-600 text-white py-2 rounded mt-2" disabled={!selected||!email||!card.number||!card.holder||!card.exp||!card.cvv||!card.docNumber||loading} onClick={handleSubscribe}>
          {loading ? 'Processando...' : 'Assinar'}
        </button>
        {error && <div className="text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200 text-sm">{error}</div>}
        {result && (
          <div className="text-green-600 mt-2 p-3 bg-green-50 rounded border border-green-200 text-sm flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            <div>
              <p className="font-bold">Assinatura criada!</p>
              <p>Redirecionando para o sistema...</p>
            </div>
          </div>
        )}
        <button className="mt-4 text-gray-500 underline text-sm w-full" onClick={onClose} disabled={loading}>Fechar</button>
      </div>
    </div>
  );
};

// Pequeno componente de ícone para uso interno se não quiser importar
const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default SubscriptionModal;
