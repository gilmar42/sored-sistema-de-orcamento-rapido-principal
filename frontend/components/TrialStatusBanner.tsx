import React, { useEffect, useMemo, useState } from 'react';
import { ClockIcon, RocketLaunchIcon, SparklesIcon } from './Icons';
import { useAuth } from '../context/AuthContext';

interface TrialStatusBannerProps {
  onOpenPlans?: () => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function formatRemaining(target: string | null) {
  if (!target) {
    return null;
  }

  const end = new Date(target);
  if (Number.isNaN(end.getTime())) {
    return null;
  }

  const diff = Math.max(0, end.getTime() - Date.now());
  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / HOUR_MS);

  if (days > 0) {
    return `${days} dia${days > 1 ? 's' : ''}${hours > 0 ? ` e ${hours}h` : ''}`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return 'hoje';
}

const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({ onOpenPlans }) => {
  const { accessStatus, trialEndsAt } = useAuth();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = accessStatus;
  const remaining = useMemo(() => formatRemaining(trialEndsAt), [trialEndsAt, now]);

  if (!status || !trialEndsAt || (status !== 'trial' && status !== 'grace')) {
    return null;
  }

  const isGrace = status === 'grace';
  const title = isGrace
    ? 'Sua assinatura entrou em período de regularização'
    : remaining === 'hoje'
      ? 'Seu teste grátis termina hoje'
      : `Seu teste grátis termina em ${remaining}`;

  const description = isGrace
    ? 'O acesso continua disponível enquanto o pagamento é confirmado.'
    : 'Você está com acesso completo e ilimitado. Nenhuma funcionalidade foi bloqueada durante o teste.';

  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-blue-400/20 bg-linear-to-r from-slate-950 via-blue-950 to-slate-900 text-white shadow-2xl">
      <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
            <SparklesIcon className="h-4 w-4" />
            Teste gratuito ativo
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
            {description} Após o período de teste, o sistema bloqueia automaticamente o acesso se não houver plano ativo.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <ClockIcon className="h-4 w-4 text-blue-200" />
              Faltam {remaining || 'pouco tempo'}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-emerald-100">
              <SparklesIcon className="h-4 w-4" />
              Acesso completo e ilimitado
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200/80">Próxima ação</p>
          <p className="mt-2 text-lg font-bold text-white">Ative agora sua assinatura e evite interrupção no acesso</p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Se o teste acabar, o paywall entra automaticamente. Se você quiser seguir sem parar, basta abrir os planos.
          </p>
          <button
            type="button"
            onClick={onOpenPlans}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-blue-800 transition-transform hover:scale-[1.01]"
          >
            <RocketLaunchIcon className="mr-2 h-5 w-5" />
            Ver planos agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialStatusBanner;
