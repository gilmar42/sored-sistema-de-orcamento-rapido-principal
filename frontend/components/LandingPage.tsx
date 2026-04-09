import React from 'react';
import { 
  CalculatorIcon, 
  BoxIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon
} from './Icons';


interface LandingPageProps {
  onGetStarted: () => void;
  onOpenPlans?: () => void;
  paymentStatus?: 'success' | 'pending' | 'failure' | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenPlans, paymentStatus }) => {
  const features = [
    {
      icon: <CalculatorIcon className="w-12 h-12 text-blue-500" />,
      title: 'Cálculos Automáticos',
      description: 'Sistema inteligente de cálculo de orçamentos baseado em componentes e materiais',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <BoxIcon className="w-12 h-12 text-purple-500" />,
      title: 'Gestão de Materiais',
      description: 'Controle completo de materiais com componentes, custos e dimensões',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <UserGroupIcon className="w-12 h-12 text-green-500" />,
      title: 'Gestão de Clientes',
      description: 'Cadastro completo com histórico de orçamentos e estatísticas',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <DocumentTextIcon className="w-12 h-12 text-orange-500" />,
      title: 'PDF Profissional',
      description: 'Gere orçamentos em PDF com logo da empresa e layout profissional',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const benefits = [
    'Economia de tempo na criação de orçamentos',
    'Cálculos precisos e automáticos',
    'Controle total de materiais e custos',
    'Interface moderna e intuitiva',
    'Dados salvos automaticamente',
    'Modo escuro para conforto visual'
  ];

  const pricingPlans = [
    {
      name: 'Plano Mensal',
      price: 'R$ 100/mês',
      description: 'Ideal para começar rápido e testar todos os recursos.',
    },
    {
      name: 'Plano Anual',
      price: 'R$ 1.100/ano',
      description: 'Opção econômica para uso contínuo com desconto.',
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-ice-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="border-b border-blue-200/70 bg-blue-950 px-4 py-3 text-white shadow-lg shadow-blue-950/20 dark:border-blue-900/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:px-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-yellow-300">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">Teste grátis de 5 dias</p>
              <p className="text-sm text-blue-50/90">
                Acesso completo e ilimitado, com cobrança automática ao final do período e cancelamento antes do vencimento.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
            <CheckCircleIcon className="h-5 w-5" />
            Risco zero para começar
          </div>
        </div>
      </div>
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-30 animate-pulse"></div>
                <SparklesIcon className="relative w-20 h-20 text-yellow-300 animate-bounce" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 animate-fade-in-up">
              Bem-vindo ao <span className="bg-linear-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent" aria-hidden="true">SORED</span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Sistema de Orçamento Rápido - A solução completa para gestão de orçamentos, materiais e clientes
            </p>
            {paymentStatus === 'success' ? (
              <div className="flex flex-col items-center gap-4 animate-fade-in-up animation-delay-400">
                <div className="bg-green-500/20 backdrop-blur border border-green-400/50 rounded-2xl px-8 py-4 mb-4">
                  <p className="text-green-100 text-lg font-semibold flex items-center gap-2">
                    <CheckCircleIcon className="w-6 h-6" />
                    Pagamento aprovado! Complete seu cadastro abaixo.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={onGetStarted}
                  data-testid="cta-hero-plans"
                  className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-full hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl relative"
                >
                  <RocketLaunchIcon className="w-6 h-6 mr-2 group-hover:translate-x-1 transition-transform" />
                  {'Começar teste grátis'}
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="bg-white dark:bg-slate-950 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Planos</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Planos simples e objetivo</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Mensal ou anual, com preço claro e recursos prontos para uso imediato.
                </p>
              </div>
              {onOpenPlans && (
                <button
                  type="button"
                  onClick={onOpenPlans}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Ver planos completos
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div key={plan.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{plan.name}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Recursos Principais
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Tudo o que você precisa para gerenciar seus orçamentos com eficiência
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`rounded-3xl p-8 shadow-xl bg-linear-to-br ${feature.color} text-white flex flex-col items-center`}>
              {feature.icon}
              <h3 className="text-2xl font-bold mt-4 mb-2">{feature.title}</h3>
              <p className="text-base text-blue-50/90 mb-2 text-center">{feature.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Por que escolher o SORED?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Simplifique sua gestão de orçamentos com uma ferramenta completa e intuitiva
            </p>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 animate-fade-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircleIcon className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-br from-blue-400 to-purple-600 rounded-3xl transform rotate-3 opacity-20"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl">
              <ChartBarIcon className="w-full h-64 text-blue-500 opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2">86+</div>
                  <div className="text-xl text-gray-600 dark:text-gray-400">Testes Automatizados</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">Qualidade Garantida</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pronto para começar?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Crie seu primeiro orçamento em minutos e veja como é fácil gerenciar seus projetos
            </p>
            {paymentStatus !== 'success' && (
              <button
                onClick={onGetStarted}
                data-testid="cta-bottom-plans"
                className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-full hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <CalculatorIcon className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Começar teste grátis
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
