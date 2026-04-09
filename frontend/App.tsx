
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
  const { currentUser, isLoading, authError, clearAuthError } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [nextView, setNextView] = useState<View>('home');
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'pending' | 'failure' | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [showBlockedPaywall, setShowBlockedPaywall] = useState(false);
  const [authInitialView, setAuthInitialView] = useState<'login' | 'signup'>('signup');

  const isAccessBlocked = Boolean(authError && authError.toLowerCase().includes('access blocked'));

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

  useEffect(() => {
    if (isAccessBlocked) {
      setShowBlockedPaywall(true);
      setShowAuth(false);
    }
  }, [isAccessBlocked]);

  if (isLoading) return null;
  if (!currentUser) {
    if (showBlockedPaywall) {
      return (
        <>
          <TrialPaywall
            onSubscribe={() => setShowPlans(true)}
            onTryAnotherAccount={() => {
              clearAuthError();
              setShowBlockedPaywall(false);
              setAuthInitialView('login');
              setShowAuth(true);
            }}
          />
          <PlansModal open={showPlans} onClose={() => setShowPlans(false)} prefillEmail={currentUser?.email ?? ''} />
        </>
      );
    }
    return (
      <>
        {showAuth && paymentStatus === 'success' ? (
          <AuthPage paymentApproved={true} initialView="signup" />
        ) : showAuth ? (
          <AuthPage paymentApproved={false} initialView={authInitialView} />
        ) : (
          <LandingPage
            onGetStarted={() => {
              setAuthInitialView('signup');
              setShowAuth(true);
            }}
            onOpenPlans={() => setShowPlans(true)}
            paymentStatus={paymentStatus}
          />
        )}
        <PlansModal open={showPlans} onClose={() => setShowPlans(false)} prefillEmail={currentUser?.email ?? ''} />
      </>
    );
  }

  // Usuário autenticado: vai direto para o sistema interno
  return (
    <DataProvider>
      <MainLayout initialView={nextView} onOpenPlans={() => setShowPlans(true)} />
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />
    </DataProvider>
  );
};

export default AppContent;
