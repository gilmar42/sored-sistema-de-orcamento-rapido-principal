import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Client } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, MagnifyingGlassIcon, UserGroupIcon, CheckIcon, XMarkIcon } from './Icons';
import { useAuth } from '../context/AuthContext';

export const ClientManagement: React.FC = () => {
  const { tenantId } = useAuth();
  const storageKey = tenantId ? `${tenantId}-clients` : 'clients';
  
  const { clients, addClient, updateClient, deleteClient } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    document: '',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor, preencha o nome do cliente.');
      return;
    }

    if (editingClient) {
      const updatedClient: Client = {
        ...editingClient,
        ...formData,
      };
      updateClient(updatedClient);
    } else {
      const newClient: Client = {
        id: `CLI-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      };
      addClient(newClient);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      document: '',
      notes: '',
    });
    setEditingClient(null);
    setIsFormOpen(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      document: client.document,
      notes: client.notes,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteClient(id);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    client.document.includes(searchTerm)
  );

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-textPrimary dark:text-white flex items-center">
          <UserGroupIcon className="w-8 h-8 mr-3 text-primary" />
          Gerenciamento de Clientes
          {clients.length > 0 && (
            <span className="ml-3 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-sm rounded-full animate-pulse">
              {clients.length}
            </span>
          )}
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl group"
        >
          <PlusIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar cliente por nome, email, telefone ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 hover:shadow-lg"
          />
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-600 p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-2" />
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    name="document"
                    value={formData.document}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 resize-none"
                    placeholder="Anotações adicionais sobre o cliente..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-600">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-textPrimary dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  {editingClient ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-surface dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center animate-bounce-gentle">
                <UserGroupIcon className="w-8 h-8 text-gray-400 dark:text-slate-500" />
              </div>
              <div className="text-textSecondary dark:text-slate-400">
                <p className="text-lg font-medium">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </p>
                <p className="text-sm">
                  {searchTerm ? 'Tente buscar com outros termos' : 'Clique em "Novo Cliente" para começar'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-textSecondary dark:text-slate-300">
              <thead className="text-xs text-gray-300 dark:text-slate-200 uppercase bg-gradient-to-r from-surface-light to-gray-100 dark:from-slate-700 dark:to-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Nome</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Email</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Telefone</th>
                  <th scope="col" className="px-6 py-4 font-semibold">CPF/CNPJ</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-gray-200 dark:border-slate-600 hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-500/5 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 ease-in-out animate-fade-in-up group"
                  >
                    <td className="px-6 py-4 font-medium text-textPrimary dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors duration-300">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-primary rounded-full mr-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {client.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">{client.email || '-'}</td>
                    <td className="px-6 py-4">{client.phone || '-'}</td>
                    <td className="px-6 py-4">{client.document || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-500 hover:text-blue-400 hover:scale-110 transition-all duration-300 ease-in-out p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Editar cliente"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-500 hover:text-red-400 hover:scale-110 transition-all duration-300 ease-in-out p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir cliente"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Card */}
      {clients.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Total de Clientes</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{clients.length}</p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-blue-500 dark:text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Com Email</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {clients.filter(c => c.email).length}
                </p>
              </div>
              <CheckIcon className="w-12 h-12 text-green-500 dark:text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-slate-300">Com Telefone</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  {clients.filter(c => c.phone).length}
                </p>
              </div>
              <CheckIcon className="w-12 h-12 text-purple-500 dark:text-purple-400 opacity-50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
