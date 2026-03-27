
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { MainLayout } from './components/MainLayout';
import type { View } from './components/MainLayout';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/LandingPage';
import PlansModal from './components/PlansModal';

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { currentUser, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [nextView, setNextView] = useState<View>('home');
  const [showLandingAfterLogin, setShowLandingAfterLogin] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failure' | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment') as 'success' | 'pending' | 'failure' | null;
    if (payment) {
      setPaymentStatus(payment);
      if (payment === 'success') {
        setShowAuth(true);
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (isLoading) return null;
  if (!currentUser) {
    return (
      <>
        {showAuth && paymentStatus === 'success' ? (
          <AuthPage paymentApproved={true} />
        ) : (
          <LandingPage
            onGetStarted={() => {
              setNextView('calculator');
              setShowPlans(true);
            }}
            paymentStatus={paymentStatus}
          />
        )}
        <PlansModal open={showPlans} onClose={() => setShowPlans(false)} />
      </>
    );
  }

  // Usuário autenticado: exibir landing de boas-vindas antes de entrar no layout
  if (showLandingAfterLogin) {
    return (
      <LandingPage
        onGetStarted={() => {
          setNextView('calculator');
          setShowLandingAfterLogin(false);
        }}
        paymentStatus={paymentStatus}
      />
    );
  }

  return (
    <DataProvider>
      <MainLayout initialView={nextView} />
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />
    </DataProvider>
  );
};

export default AppContent;
