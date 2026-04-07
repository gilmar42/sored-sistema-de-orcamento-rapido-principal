import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { AppSettings } from '../types';
import { CheckCircleIcon } from './Icons';
import normalizeMaterials from '../utils/normalizeMaterials';

export const Settings: React.FC = () => {
  const { settings, setSettings } = useData();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalSettings({ ...localSettings, [e.target.name]: e.target.value });
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setSettings(localSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };
  const [migrateStatus, setMigrateStatus] = useState<string | null>(null);

  const handleMigrateLocalStorage = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sored_'));
      let migrated = 0;
      keys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (k.startsWith('sored_materials')) {
            // normalize materials
            const normalized = (normalizeMaterials as any)(parsed || []);
            localStorage.setItem(k, JSON.stringify(normalized));
            migrated += 1;
          }
        } catch (e) {
          // ignore per-key errors
        }
      });
      setMigrateStatus(`Migrated ${migrated} material(s) storage key(s).`);
      setTimeout(() => setMigrateStatus(null), 4000);
    } catch (err) {
      setMigrateStatus('Migration failed. See console for details.');
      // eslint-disable-next-line no-console
      console.error('Migration error', err);
      setTimeout(() => setMigrateStatus(null), 6000);
    }
  };
  
  return (
    <div className="container mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-textPrimary mb-6">Configurações da Empresa</h2>
      <div className="bg-surface p-6 rounded-lg shadow-md space-y-6">
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">Nome da Empresa</label>
          <input 
            type="text" 
            name="companyName"
            value={localSettings.companyName}
            onChange={handleInputChange}
            className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-textPrimary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">Informações de Contato</label>
          <textarea 
            name="companyContact"
            value={localSettings.companyContact}
            onChange={handleInputChange}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-textPrimary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Ex: Telefone, E-mail, Endereço"
          />
        </div>
        <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Logotipo da Empresa</label>
            <div className="mt-2 flex items-center space-x-4">
                {localSettings.companyLogo && <img src={localSettings.companyLogo} alt="logo" className="h-16 w-16 object-contain border p-1 rounded-md bg-gray-200 border-gray-600"/>}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="block text-sm text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-blue-300 hover:file:bg-blue-800 transition-colors"/>
            </div>
        </div>
        <div className="flex justify-between items-center pt-4">
            <button 
              onClick={handleSave} 
              className="flex items-center justify-center px-6 py-2 bg-secondary text-white rounded-md hover:bg-green-600 transition-colors"
            >
                {showSuccess ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : null}
                {showSuccess ? 'Salvo com Sucesso!' : 'Salvar Configurações'}
            </button>
          <div className="flex items-center space-x-3">
            <button onClick={handleMigrateLocalStorage} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">Migrar dados locais</button>
            {migrateStatus ? <span className="text-sm text-textSecondary">{migrateStatus}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};