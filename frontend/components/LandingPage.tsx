import React, { useState } from 'react';
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
  paymentStatus?: 'success' | 'pending' | 'failure' | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, paymentStatus }) => {
  // eslint-disable-next-line no-console
  console.log('[DEBUG] LandingPage montado');


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

  return (
    <div className="min-h-screen bg-linear-to-br from-ice-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
              <button
                type="button"
                onClick={onGetStarted}
                data-testid="cta-hero-plans"
                className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-full hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl relative"
              >
                <RocketLaunchIcon className="w-6 h-6 mr-2 group-hover:translate-x-1 transition-transform" />
                {'Ver Planos'}
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></span>
              </button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full fill-ice-50 dark:fill-slate-900">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>

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
                Ver Planos
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
