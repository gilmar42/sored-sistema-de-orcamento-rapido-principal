import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SoredIcon } from '../Icons';

export const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { login, signup } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center mb-6 text-primary">
            <SoredIcon className="w-12 h-12"/>
            <h1 className="ml-3 text-3xl font-bold text-textPrimary">SORED</h1>
        </div>
        <div className="bg-surface shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-center text-2xl font-semibold text-textPrimary mb-6">
            {isLoginView ? 'Acessar sua Conta' : 'Criar Nova Conta'}
          </h2>
          <form onSubmit={handleSubmit}>
            {!isLoginView && (
              <div className="mb-4">
                <label className="block text-textSecondary text-sm font-bold mb-2" htmlFor="companyName">
                  Nome da Empresa
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-textPrimary leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-textSecondary text-sm font-bold mb-2" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-textPrimary leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-textSecondary text-sm font-bold mb-2" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-textPrimary mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
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
          <div className="text-center mt-6">
            <button onClick={toggleView} className="inline-block align-baseline font-bold text-sm text-primary hover:text-blue-500">
              {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          </div>
        </div>
        <p className="text-center text-textSecondary text-xs">
          &copy;{new Date().getFullYear()} SORED. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};