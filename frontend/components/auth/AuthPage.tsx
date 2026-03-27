import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SoredIcon } from '../Icons';

interface AuthPageProps {
  paymentApproved?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ paymentApproved = false }) => {
  const [isLoginView, setIsLoginView] = useState(!paymentApproved);
  const { login, signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleDemoAccess = async () => {
    setError('');
    setIsLoading(true);
    try {
      const demoEmail = `demo${Date.now()}@sored.demo`;
      const demoPassword = 'demo123';
      const success = await signup('Empresa Demo', demoEmail, demoPassword);
      if (!success) {
        setError('Erro ao criar acesso demo. Tente criar uma conta.');
      }
    } catch (e) {
      setError('Erro ao criar acesso demo. Tente criar uma conta.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (paymentApproved) {
      setIsLoginView(false);
    }
  }, [paymentApproved]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let success = false;
    try {
        if (isLoginView) {
            if (!email || !password) {
                setError("Por favor, preencha e-mail e senha.");
                return;
            }
            success = await login(email, password);
            if (!success) setError('E-mail ou senha inválidos.');
        } else {
            if (!companyName || !email || !password) {
                setError("Por favor, preencha todos os campos.");
                return;
            }
            success = await signup(companyName, email, password);
            if (!success) setError('Este e-mail já está em uso.');
        }
    } catch (e) {
        setError('Ocorreu um erro. Tente novamente.');
    } finally {
        setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setEmail('');
    setPassword('');
    setCompanyName('');
  };

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center mb-6 text-primary">
            <SoredIcon className="w-12 h-12"/>
            <h1 className="ml-3 text-3xl font-bold text-textPrimary dark:text-slate-100">SORED</h1>
        </div>
        {paymentApproved && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-4 text-center">
            <p className="text-green-600 dark:text-green-400 font-semibold">
              ✅ Pagamento aprovado! Complete seu cadastro para receber seu ID por e-mail.
            </p>
          </div>
        )}
        <div className="bg-surface dark:bg-slate-800 shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-center text-2xl font-semibold text-textPrimary dark:text-slate-100 mb-6">
            {isLoginView ? 'Acessar sua Conta' : 'Criar Nova Conta'}
          </h2>
          <form onSubmit={handleSubmit}>
            {!isLoginView && (
              <div className="mb-4">
                <label className="block text-textSecondary dark:text-slate-300 text-sm font-bold mb-2" htmlFor="companyName">
                  Nome da Empresa
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-gray-700 dark:bg-slate-700 shadow appearance-none border border-gray-600 dark:border-slate-600 rounded w-full py-2 px-3 text-textPrimary dark:text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-textSecondary dark:text-slate-300 text-sm font-bold mb-2" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 dark:bg-slate-700 shadow appearance-none border border-gray-600 dark:border-slate-600 rounded w-full py-2 px-3 text-textPrimary dark:text-slate-100 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-textSecondary dark:text-slate-300 text-sm font-bold mb-2" htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-700 dark:bg-slate-700 shadow appearance-none border border-gray-600 dark:border-slate-600 rounded w-full py-2 px-3 text-textPrimary dark:text-slate-100 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 dark:hover:text-slate-100 focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.221 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.221-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.221 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.221 1.125-4.575m2.122-2.122A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.221-1.125 4.575m-2.122 2.122A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.221 1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors disabled:bg-gray-600"
              >
                {isLoading ? 'Carregando...' : (isLoginView ? 'Entrar' : 'Criar Conta')}
              </button>
            </div>
          </form>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleDemoAccess}
                        disabled={isLoading}
                        className="w-full bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-all disabled:opacity-50"
                      >
                        🚀 Acesso Demo (Testar Sistema)
                      </button>
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                        Cria uma conta temporária automaticamente
                      </p>
                    </div>
          <div className="text-center mt-6">
            <button onClick={toggleView} className="inline-block align-baseline font-bold text-sm text-primary hover:text-blue-500">
              {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
        <p className="text-center text-textSecondary dark:text-slate-400 text-xs">
          &copy;{new Date().getFullYear()} SORED. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};