
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
import TrialPaywall from './components/TrialPaywall';

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const { currentUser, isLoading, accessStatus, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [nextView, setNextView] = useState<View>('home');
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failure' | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'signup'>('signup');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment') as 'success' | 'pending' | 'failure' | null;
    if (payment) {
      setPaymentStatus(payment);
      if (payment === 'success') {
        setShowAuth(true);
      } else if (payment === 'failure') {
        // Se falhou, garantir que o usuário veja a landing page ou uma mensagem clara
        setShowAuth(false);
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (isLoading) return null;

  // ── Usuário não autenticado ──
  if (!currentUser) {
    if (showAuth) {
      return (
        <>
          <AuthPage initialView={authInitialView} />
          <ToastContainer toasts={toasts} onCloseToast={removeToast} />
        </>
      );
    }

    return (
      <DataProvider>
        <LandingPage 
          onGetStarted={() => setShowAuth(true)} 
          paymentStatus={paymentStatus}
        />
        <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </DataProvider>
    );
  }

  // ── Usuário autenticado mas com acesso bloqueado (trial expirado) ──
  if (currentUser && accessStatus === 'blocked') {
    return (
      <>
        <TrialPaywall
          onSubscribe={() => setShowPlans(true)}
          onGoHome={async () => {
            await logout();
            setShowAuth(false);
            setPaymentStatus(null);
          }}
        />
        <PlansModal
          open={showPlans}
          onClose={() => setShowPlans(false)}
          prefillEmail={currentUser.email}
        />
        <ToastContainer toasts={toasts} onCloseToast={removeToast} />
      </>
    );
  }

  // ── Usuário autenticado com acesso liberado ──
  return (
    <DataProvider>
      <MainLayout initialView={nextView} onOpenPlans={() => setShowPlans(true)} />
      <PlansModal open={showPlans} onClose={() => setShowPlans(false)} prefillEmail={currentUser.email} />
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />
    </DataProvider>
  );
};

export default AppContent;
