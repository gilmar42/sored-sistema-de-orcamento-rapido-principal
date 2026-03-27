import React, { useState } from 'react';
import { QuoteCalculator } from './QuoteCalculator';
import { MaterialManagement } from './MaterialManagement';

import { Settings } from './Settings';
import { SavedQuotes } from './SavedQuotes';
import type { Quote } from '../types';
import { SoredIcon, CalculatorIcon, BoxIcon, CogIcon, DocumentTextIcon, ArrowLeftOnRectangleIcon } from './Icons';
import { useAuth } from './../context/AuthContext';
import { NavItem } from './NavItem';


type View = 'calculator' | 'materials' | 'settings' | 'quotes';

export const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('calculator');
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const { logout } = useAuth();

  // Diagnostic: log view changes during debugging
  React.useEffect(() => {
    console.log('[DEBUG] MainLayout currentView ->', currentView);
  }, [currentView]);

  const handleEditQuote = (quote: Quote) => {
    setQuoteToEdit(quote);
    setCurrentView('calculator');
  };

  const renderView = () => {
    switch (currentView) {
      case 'calculator':
        return <QuoteCalculator data-testid="quote-calculator" quoteToEdit={quoteToEdit} setQuoteToEdit={setQuoteToEdit} />;
      case 'materials':
        return <MaterialManagement activeView={currentView} />;
      case 'settings':
        return <Settings />;
      case 'quotes':
        return <SavedQuotes onEditQuote={handleEditQuote} />;
      default:
        return <QuoteCalculator quoteToEdit={quoteToEdit} setQuoteToEdit={setQuoteToEdit} />;
    }
  };
  


  return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        <aside className="w-full md:w-56 bg-surface shadow-lg fixed bottom-0 md:relative md:min-h-screen z-20 flex flex-col">
          <div className="px-4 py-6 flex-grow">
            <div className="flex items-center justify-center text-primary mb-8">
              <SoredIcon className="w-8 h-8"/>
              <h1 className="ml-2 text-xl font-bold text-textPrimary hidden md:block">SORED</h1>
            </div>
            <nav className="flex flex-row md:flex-col justify-around md:space-y-2">
              <NavItem view="calculator" label="Novo Orçamento" icon={<CalculatorIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="quotes" label="Orçamentos" icon={<DocumentTextIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="materials" label="Materiais" icon={<BoxIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
              <NavItem view="settings" label="Configurações" icon={<CogIcon className="w-5 h-5" />} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
            </nav>
          </div>
          <div className="p-4 hidden md:block">
             <NavItem label="Sair" icon={<ArrowLeftOnRectangleIcon className="w-5 h-5" />} onClick={logout} currentView={currentView} setCurrentView={setCurrentView} setQuoteToEdit={setQuoteToEdit} />
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8" data-testid="main-view-container">
          {renderView()}
        </main>
      </div>
  );
};