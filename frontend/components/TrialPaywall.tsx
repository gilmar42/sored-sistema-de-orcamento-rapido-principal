import React from 'react';
import { CheckCircleIcon, RocketLaunchIcon, SparklesIcon } from './Icons';

interface TrialPaywallProps {
  onSubscribe: () => void;
  onTryAnotherAccount: () => void;
  trialDays?: number;
}

export const TrialPaywall: React.FC<TrialPaywallProps> = ({
  onSubscribe,
  onTryAnotherAccount,
  trialDays = 5,
}) => {
  const highlights = [
    'Acesso completo e ilimitado ao sistema',
    'Automação para reduzir retrabalho e desorganização',
    'Conversão de orçamentos com menos esforço manual',
    'Continuidade automática após a assinatura ativa',
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at top, rgba(59,130,246,0.55), transparent 35%), radial-gradient(circle at bottom right, rgba(16,185,129,0.25), transparent 30%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100">
                <SparklesIcon className="h-4 w-4" />
                Teste grátis encerrado
              </div>
              <h1 className="mt-6 text-4xl sm:text-5xl font-black tracking-tight">
                Seu acesso foi pausado até a assinatura ser ativada
              </h1>
              <p className="mt-5 max-w-2xl text-lg sm:text-xl text-slate-200 leading-relaxed">
                Você já aproveitou {trialDays} dias grátis com acesso completo e sem limitações.
                Agora, para continuar usando o sistema sem interrupções, basta ativar o plano padrão.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      <span className="text-sm sm:text-base text-slate-100">{item}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onSubscribe}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-base font-bold text-blue-700 shadow-xl shadow-blue-950/30 transition-transform hover:scale-[1.02]"
                >
                  <RocketLaunchIcon className="mr-2 h-5 w-5" />
                  Ativar assinatura agora
                </button>
                <button
                  type="button"
                  onClick={onTryAnotherAccount}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Entrar com outra conta
                </button>
              </div>

              <p className="mt-4 text-sm text-slate-300">
                Assim que a assinatura for aprovada, o acesso é liberado automaticamente e você continua sem perder o histórico.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] bg-blue-500/20 blur-2xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 sm:p-8 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-blue-200/80">Proteção de receita</p>
                    <h2 className="mt-2 text-2xl font-bold">Continue automatizando</h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                    <CheckCircleIcon className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Status do acesso</p>
                    <p className="mt-1 text-lg font-semibold text-white">Bloqueado até pagamento aprovado</p>
                  </div>
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                    <p className="text-sm text-blue-100/80">Benefício principal</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Menos tempo perdido, mais organização e mais conversão
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Retorno</p>
                      <p className="mt-1 text-lg font-bold">Imediato após ativação</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-400">Cancelamento</p>
                      <p className="mt-1 text-lg font-bold">Sem complicação</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-800/80 p-4 text-sm text-slate-300">
                  Clique em “Ativar assinatura agora” para abrir os planos e liberar o acesso sem precisar recomeçar tudo do zero.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialPaywall;
