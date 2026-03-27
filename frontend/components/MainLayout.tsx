import React, { useState } from 'react';
import { QuoteCalculator } from './QuoteCalculator';
import { MaterialManagement } from './MaterialManagement';
import { ClientManagement } from './ClientManagement';
import { Settings } from './Settings';
import { SavedQuotes } from './SavedQuotes';
import { LandingPage } from './LandingPage';
import { HourlyQuote } from './HourlyQuote';
import { MachineHourQuote } from './MachineHourQuote';
import type { Quote } from '../types';
import { SoredIcon, CalculatorIcon, BoxIcon, CogIcon, DocumentTextIcon, ArrowLeftOnRectangleIcon, SunIcon, MoonIcon, UserGroupIcon, HomeIcon, ClockIcon } from './Icons';
import { useAuth } from './../context/AuthContext';
import { NavItem } from './NavItem';
import { useDarkMode } from '../hooks/useDarkMode';


export type View = 'home' | 'calculator' | 'hourly' | 'machine' | 'materials' | 'settings' | 'quotes' | 'clients';

interface MainLayoutProps {
  initialView?: View;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialView }) => {
  const [currentView, setCurrentView] = useState<View>(initialView ?? 'home');
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const { currentUser, isLoading, login, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [loginState, setLoginState] = useState({ email: '', password: '', error: '' });

  React.useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  // Diagnostic: log view changes during debugging
  React.useEffect(() => {
    console.log('[DEBUG] MainLayout currentView ->', currentView);
  }, [currentView]);

  const handleEditQuote = (quote: Quote) => {
    setQuoteToEdit(quote);
    setCurrentView('calculator');
  };

  const handleGetStarted = () => {
    setCurrentView('calculator');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <LandingPage onGetStarted={handleGetStarted} />;
      case 'calculator':
        // Adiciona data-testid para testes
        return <QuoteCalculator quoteToEdit={quoteToEdit} setQuoteToEdit={setQuoteToEdit} onNavigateToMaterials={() => setCurrentView('materials')} />;
      case 'hourly':
        return <HourlyQuote />;
      case 'machine':
        return <MachineHourQuote />;
      case 'materials':
        return <MaterialManagement activeView={currentView} />;
      case 'clients':
        return <ClientManagement />;
      case 'settings':
        return <Settings />;
      case 'quotes':
        return <SavedQuotes onEditQuote={handleEditQuote} />;
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  // Tela de login simples
  if (!isLoading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ice-50 dark:bg-slate-900">
        <form
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-4"
          onSubmit={async e => {
            e.preventDefault();
            setLoginState(s => ({ ...s, error: '' }));
            const ok = await login(loginState.email, loginState.password);
            if (!ok) setLoginState(s => ({ ...s, error: 'Credenciais inválidas' }));
          }}
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-blue-700 dark:text-blue-200">Login SORED</h2>
          <input
            type="email"
            placeholder="E-mail"
            className="rounded px-3 py-2 border border-gray-300 dark:bg-slate-700 dark:text-white"
            value={loginState.email}
            onChange={e => setLoginState(s => ({ ...s, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="rounded px-3 py-2 border border-gray-300 dark:bg-slate-700 dark:text-white"
            value={loginState.password}
            onChange={e => setLoginState(s => ({ ...s, password: e.target.value }))}
            required
          />
          {loginState.error && <div className="text-red-500 text-sm text-center">{loginState.error}</div>}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-all"
            disabled={isLoading}
          >Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-ice-50 dark:bg-slate-900 transition-all duration-300 ease-in-out">
        <aside className="w-full md:w-56 bg-linear-to-b from-sidebar-700 to-sidebar-900 dark:from-sidebar-800 dark:to-slate-900 shadow-lg hover:shadow-xl fixed bottom-0 md:relative md:min-h-screen z-20 flex flex-col transition-all duration-300 ease-in-out backdrop-blur-sm">
          <div className="px-4 py-6 grow">
            <div className="flex items-center justify-between md:justify-center text-white mb-8 group">
              <div className="flex items-center hover:scale-105 transition-all duration-300 ease-in-out">
                <SoredIcon className="w-8 h-8 text-ice-300 group-hover:rotate-12 transition-transform duration-300 ease-in-out"/>
                <h1 className="ml-2 text-xl font-bold hidden md:block bg-linear-to-r from-ice-200 to-ice-400 bg-clip-text text-transparent group-hover:from-ice-400 group-hover:to-ice-200 transition-all duration-300">SORED</h1>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-sidebar-600 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 md:hidden group shadow-lg hover:shadow-xl"
                aria-label="Toggle dark mode"
              >
                {isDark ? 
                  <SunIcon className="w-5 h-5 text-ice-200 group-hover:text-yellow-300 transition-all duration-300 group-hover:rotate-180" /> : 
                  <MoonIcon className="w-5 h-5 text-ice-200 group-hover:text-ice-100 transition-all duration-300 group-hover:-rotate-12" />
                }
              </button>
            </div>
            <nav className="flex flex-row md:flex-col justify-around md:space-y-2">
              <NavItem view="home" label="Início" icon={<HomeIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="calculator" label="Novo Orçamento" icon={<CalculatorIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
                            <NavItem view="hourly" label="Hora-Homem" icon={<ClockIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="machine" label="Hora-Máquina" icon={<CogIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="quotes" label="Orçamentos" icon={<DocumentTextIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="clients" label="Clientes" icon={<UserGroupIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="materials" label="Materiais" icon={<BoxIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="settings" label="Configurações" icon={<CogIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
            </nav>
          </div>
          <div className="p-4 hidden md:block space-y-2">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-sidebar-600 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out text-ice-100 dark:text-slate-300 group hover:scale-105 active:scale-95 hover:shadow-lg"
              aria-label="Toggle dark mode"
            >
              {isDark ? 
                <SunIcon className="w-5 h-5 text-ice-200 group-hover:text-yellow-300 transition-all duration-300 group-hover:rotate-180" /> : 
                <MoonIcon className="w-5 h-5 text-ice-200 group-hover:text-ice-100 transition-all duration-300 group-hover:-rotate-12" />
              }
              <span className="text-sm font-medium text-white group-hover:text-ice-100 transition-colors duration-300">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <NavItem label="Sair" icon={<ArrowLeftOnRectangleIcon className="w-5 h-5" />} onClick={logout} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 transition-all duration-500 ease-in-out transform" data-testid="main-view-container">
          <div className="animate-fade-in-up">
            {renderView()}
          </div>
        </main>
      </div>
  );
};

export { MainLayout };