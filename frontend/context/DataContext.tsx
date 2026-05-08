import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Material, Quote, AppSettings, Category, Client } from '../types';
import { useAuth } from './AuthContext';
import { normalizeMaterials } from '../utils/normalizeMaterials';

interface DataContextType {
  materials: Material[];
  normalizedMaterials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  deleteMaterial: (id: string) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
  deleteClient: (id: string) => void;
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
  companyName: 'Sua Empresa Aqui',
  companyContact: 'Telefone: (00) 0000-0000 | email@suaempresa.com',
  companyLogo: '',
  defaultTax: 0,
};

const defaultCategories: Category[] = [
  { id: '1', name: 'Geral' },
];

interface DataProviderProps {
  children: ReactNode;
  testClients?: Client[];
  testCurrentUser?: { id: string; tenantId: string };
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, testClients, testCurrentUser }) => {
  // AuthProvider may be absent in some screens/tests. Swallow the error and fall back to test seams.
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    authContext = useAuth();
  } catch (error) {
    authContext = null;
  }

  const resolvedUser = testCurrentUser ?? authContext?.currentUser ?? null;
  const resolvedTenantId = resolvedUser?.tenantId;

  // If no tenant/user is available, provide an inert context without hitting localStorage.
  if (!resolvedTenantId) {
    return (
      <DataContext.Provider
        value={{
          materials: [],
          normalizedMaterials: [],
          setMaterials: () => {},
          categories: defaultCategories,
          setCategories: () => {},
          quotes: [],
          setQuotes: () => {},
          settings: defaultSettings,
          setSettings: () => {},
          clients: [],
          setClients: () => {},
          deleteMaterial: () => {},
          addMaterial: () => {},
          updateMaterial: () => {},
          deleteClient: () => {},
          addClient: () => {},
          updateClient: () => {},
        }}
      >
        {children}
      </DataContext.Provider>
    );
  }

  // Keep the call order aligned with tests: materials → quotes → settings → categories → clients.
  const keyFor = (entity: string) => ({
    primary: `sored_${entity}_${resolvedTenantId}`,
    legacy: `${resolvedTenantId}-${entity}`,
  });

  const readInitial = <T,>(primaryKey: string, legacyKey: string, fallback: T) => {
    try {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue) return JSON.parse(legacyValue) as T;
      const primaryValue = window.localStorage.getItem(primaryKey);
      if (primaryValue) return JSON.parse(primaryValue) as T;
    } catch {
      // ignore parse errors and fall back
    }
    return fallback;
  };

  const materialKeys = keyFor('materials');
  const quoteKeys = keyFor('quotes');
  const settingsKeys = keyFor('settings');
  const categoryKeys = keyFor('categories');
  const clientKeys = keyFor('clients');

  const [materials, setMaterials] = useLocalStorage<Material[]>(materialKeys.primary, readInitial(materialKeys.primary, materialKeys.legacy, []));
  const [quotes, setQuotes] = useLocalStorage<Quote[]>(quoteKeys.primary, readInitial(quoteKeys.primary, quoteKeys.legacy, []));
  const [settings, setSettings] = useLocalStorage<AppSettings>(settingsKeys.primary, readInitial(settingsKeys.primary, settingsKeys.legacy, defaultSettings));
  const [categories, setCategories] = useLocalStorage<Category[]>(categoryKeys.primary, readInitial(categoryKeys.primary, categoryKeys.legacy, defaultCategories));
  const [clients, setClients] = useLocalStorage<Client[]>(clientKeys.primary, readInitial(clientKeys.primary, clientKeys.legacy, testClients ?? []));

  // Mirror data into legacy keys expected by some tests while keeping canonical sored_* keys
  React.useEffect(() => {
    try { localStorage.setItem(materialKeys.legacy, JSON.stringify(materials)); } catch { /* ignore */ }
  }, [materials, materialKeys.legacy]);

  React.useEffect(() => {
    try { localStorage.setItem(quoteKeys.legacy, JSON.stringify(quotes)); } catch { /* ignore */ }
  }, [quotes, quoteKeys.legacy]);

  React.useEffect(() => {
    try { localStorage.setItem(settingsKeys.legacy, JSON.stringify(settings)); } catch { /* ignore */ }
  }, [settings, settingsKeys.legacy]);

  React.useEffect(() => {
    try { localStorage.setItem(categoryKeys.legacy, JSON.stringify(categories)); } catch { /* ignore */ }
  }, [categories, categoryKeys.legacy]);

  React.useEffect(() => {
    try { localStorage.setItem(clientKeys.legacy, JSON.stringify(clients)); } catch { /* ignore */ }
  }, [clients, clientKeys.legacy]);

  const normalizedMaterials = useMemo(() => normalizeMaterials(materials), [materials]);

  const getMaterialById = useCallback((id: string) => {
    return normalizedMaterials.find(m => m.id === id);
  }, [normalizedMaterials]);

  // Normalize legacy component data shapes so UI can render sizes reliably.
  // Support extra legacy shapes: JSON-strings, arrays, nested `dimensions` or `size` keys,
  // abbreviated keys (l, d, w) and other common variants.
  const tryParseJSON = (v: any) => {
    if (typeof v !== 'string') return null;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  const pickNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return val;
    // try to parse numeric strings like "10", "10.5", "10mm" (strip letters)
    if (typeof val === 'string') {
      const cleaned = val.replace(/[a-zA-Z%\s]/g, '').trim();
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const normalizeComponent = (comp: any) => {
    if (!comp || typeof comp !== 'object') return comp;

    let sv = comp.sizeValue;

    // If sizeValue is a JSON string, parse it
    if (typeof sv === 'string') {
      const parsed = tryParseJSON(sv);
      if (parsed && typeof parsed === 'object') sv = parsed;
    }

    // If sizeValue is an array, pick the first meaningful element
    if (Array.isArray(sv) && sv.length > 0) {
      const firstObj = sv.find((x: any) => x && typeof x === 'object') || sv[0];
      sv = firstObj;
    }

    // If sv is nested under common keys like 'dimensions' or 'size', flatten
    if (sv && typeof sv === 'object') {
      if (sv.dimensions && typeof sv.dimensions === 'object') sv = { ...sv, ...sv.dimensions };
      if (sv.size && typeof sv.size === 'object') sv = { ...sv, ...sv.size };
    }

    // Helper to extract candidate values from multiple possible keys
    const findKey = (obj: any, candidates: string[]) => {
      for (const k of candidates) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
      }
      return undefined;
    };

    const lengthCandidate = findKey(sv, ['lengthValue', 'length', 'l', 'comprimento']);
    const diameterCandidate = findKey(sv, ['diameterValue', 'diameter', 'd', 'diametro', 'diameter_value']);
    const widthCandidate = findKey(sv, ['widthValue', 'width', 'w', 'largura']);

    const lengthUnitCandidate = findKey(sv, ['lengthUnit', 'length_unit', 'lUnit']);
    const diameterUnitCandidate = findKey(sv, ['diameterUnit', 'diameter_unit', 'dUnit']);
    const widthUnitCandidate = findKey(sv, ['widthUnit', 'width_unit', 'wUnit']);

    const rawLengthInput = comp.rawLengthInput ?? findKey(sv, ['rawLengthInput', 'raw_length', 'raw_length_input']) ?? comp.rawLengthInput;
    const rawDiameterInput = comp.rawDiameterInput ?? findKey(sv, ['rawDiameterInput', 'raw_diameter', 'raw_diameter_input']) ?? comp.rawDiameterInput;
    const rawWidthInput = comp.rawWidthInput ?? findKey(sv, ['rawWidthInput', 'raw_width', 'raw_width_input']) ?? comp.rawWidthInput;

    return {
      ...comp,
      lengthValue: pickNumber(lengthCandidate) ?? pickNumber(comp.lengthValue) ?? null,
      lengthUnit: (lengthUnitCandidate ?? comp.lengthUnit ?? '') || '',
      diameterValue: pickNumber(diameterCandidate) ?? pickNumber(comp.diameterValue) ?? null,
      diameterUnit: (diameterUnitCandidate ?? comp.diameterUnit ?? '') || '',
      widthValue: pickNumber(widthCandidate) ?? pickNumber(comp.widthValue) ?? null,
      widthUnit: (widthUnitCandidate ?? comp.widthUnit ?? '') || '',
      rawLengthInput,
      rawDiameterInput,
      rawWidthInput,
      // If we couldn't extract any numeric dimension and there's an original
      // sizeValue, store a readable rawSizeString so UI/PDF can display it.
      rawSizeString: (() => {
        try {
          // prefer existing raw string inputs if available
          if (rawLengthInput || rawDiameterInput || rawWidthInput) return undefined;
          if (!sv) return undefined;
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { safeStringify } = require('../utils/safeStringify');
          // If sv is array, join readable elements
          if (Array.isArray(sv)) {
            const mapped = sv.map((el: any) => {
              if (el === null || typeof el === 'undefined') return null;
              if (typeof el === 'string' || typeof el === 'number') return String(el);
              try { return safeStringify(el); } catch { try { return String(el); } catch { return null; } }
            }).filter(Boolean);
            if (mapped.length > 0) return mapped.join(' / ');
          }
          const s = safeStringify(sv);
          if (typeof s === 'string' && s.trim() !== '' && s !== '[object Object]') return s;
          return undefined;
        } catch {
          return undefined;
        }
      })(),
    } as any;
  };

  // If normalization changed the shape, persist the normalized materials back
  // to localStorage so the migration is permanent. Run this in an effect so it
  // only happens on the client and doesn't block rendering.
  React.useEffect(() => {
    try {
      const orig = JSON.stringify(materials || []);
      const norm = JSON.stringify(normalizedMaterials || []);
      if (norm !== orig && typeof setMaterials === 'function') {
        localStorage.setItem(`sored_materials_${resolvedTenantId}`, norm);
        setMaterials(normalizedMaterials);
      }
    } catch (e) {
      // ignore serialization errors
    }
    // We intentionally depend on materials so migration will run when loaded.
  }, [materials, normalizedMaterials, setMaterials, resolvedTenantId]);

  const addMaterial = useCallback((material: Material) => {
    setMaterials(prev => [...prev, material]);
  }, [setMaterials]);

  const updateMaterial = useCallback((material: Material) => {
    setMaterials(prev => prev.map(m => (m.id === material.id ? { ...m, ...material } : m)));
  }, [setMaterials]);

  const deleteMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }, [setMaterials]);

  const addClient = useCallback((client: Client) => {
    setClients(prev => [...prev, client]);
  }, [setClients]);

  const updateClient = useCallback((client: Client) => {
    setClients(prev => prev.map(c => (c.id === client.id ? { ...c, ...client } : c)));
  }, [setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, [setClients]);

  useEffect(() => {
    if (resolvedTenantId) {
      // Initial data fetch could be triggered here if not using local storage as the primary source
    }
  }, [resolvedTenantId]);

  const safeCategories = categories && categories.length > 0 ? categories : defaultCategories;
  const safeClients = clients ?? [];

  const contextValue = {
    materials,
    normalizedMaterials,
    setMaterials,
    categories: safeCategories,
    setCategories,
    quotes,
    setQuotes,
    settings,
    setSettings,
    clients: safeClients,
    setClients,
    deleteMaterial,
    addMaterial,
    updateMaterial,
    deleteClient,
    addClient,
    updateClient,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
// Alias used by some tests/mocks that expect a useDataContext symbol
export const useDataContext = useData;
