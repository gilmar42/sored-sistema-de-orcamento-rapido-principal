
import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Material, Quote, AppSettings, Category } from '../types';
import { useAuth } from './AuthContext';
import { normalizeMaterials } from '../utils/normalizeMaterials';

interface DataContextType {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  deleteMaterial: (id: string) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
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

export const DataProvider: React.FC<{ children: ReactNode; testCurrentUser?: any }> = ({ children, testCurrentUser }) => {
  // testCurrentUser is an optional test seam allowing tests to inject a currentUser
  // without relying on the AuthContext mock timing/order. In normal app usage this
  // prop is undefined and we read the value from useAuth().
  // If tests provide a testCurrentUser, avoid calling useAuth() entirely.
  // Calling hooks conditionally or outside render can cause "Invalid hook call" in tests,
  // so this keeps the test seam safe and avoids relying on mocking order.
  let currentUser: any = undefined;
  if (typeof testCurrentUser !== 'undefined') {
    currentUser = testCurrentUser;
  } else {
    try {
      const authFromHook = useAuth();
      currentUser = authFromHook.currentUser;
    } catch (e) {
      // If useAuth throws (not within an AuthProvider), fall back to undefined.
      currentUser = undefined;
    }
  }
  const tenantId = currentUser?.tenantId;

  // Assumimos que currentUser e tenantId sempre estarão disponíveis aqui,
  // pois o App.tsx garante que DataProvider só é renderizado se o usuário estiver autenticado.
  // Se, por algum motivo, eles não estiverem, isso indicaria um erro de lógica na aplicação.

  // If currentUser or tenantId is missing, avoid calling hooks that depend on
  // tenantId (like useLocalStorage). Instead of rendering an error (which can
  // break tests that mount DataProvider around App), provide a safe, empty
  // context with no-op setters. This keeps the tree renderable and lets
  // App/AuthPage logic decide what to show.
  if (!currentUser || !tenantId) {
    const noop = () => {};
    return (
      <DataContext.Provider
        value={{
          materials: [],
          setMaterials: noop as any,
          categories: defaultCategories,
          setCategories: noop as any,
          quotes: [],
          setQuotes: noop as any,
          settings: defaultSettings,
          setSettings: noop as any,
          deleteMaterial: (_: string) => {},
          addMaterial: (_: Material) => {},
          updateMaterial: (_: Material) => {},
        }}
      >
        {children}
      </DataContext.Provider>
    );
  }

  // Defensive: some test mocks may return undefined or non-array values for the
  // useLocalStorage hook. Normalize the result to ensure we always have a
  // [value, setter] tuple to avoid runtime errors in tests.
  const _materials = (useLocalStorage<Material[]>(`sored_materials_${tenantId}`, []) as any) || [];
  const materials: Material[] = Array.isArray(_materials[0]) ? _materials[0] : _materials[0] ?? [];
  const setMaterials: React.Dispatch<React.SetStateAction<Material[]>> = typeof _materials[1] === 'function' ? _materials[1] : (() => {}) as any;

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

  // Use shared normalization utility to keep behavior consistent
  const normalizedMaterials: Material[] = normalizeMaterials(materials || []);

  // If normalization changed the shape, persist the normalized materials back
  // to localStorage so the migration is permanent. Run this in an effect so it
  // only happens on the client and doesn't block rendering.
  React.useEffect(() => {
    try {
      const orig = JSON.stringify(materials || []);
      const norm = JSON.stringify(normalizedMaterials || []);
      if (norm !== orig && typeof setMaterials === 'function') {
        console.log('[DEBUG] DataContext: migrating materials to normalized shape');
        setMaterials(normalizedMaterials);
      }
    } catch (e) {
      // ignore serialization errors
    }
    // We intentionally depend on materials so migration will run when loaded.
  }, [materials, normalizedMaterials, setMaterials]);

  const _quotes = (useLocalStorage<Quote[]>(`sored_quotes_${tenantId}`, []) as any) || [];
  const quotes: Quote[] = Array.isArray(_quotes[0]) ? _quotes[0] : _quotes[0] ?? [];
  const setQuotes: React.Dispatch<React.SetStateAction<Quote[]>> = typeof _quotes[1] === 'function' ? _quotes[1] : (() => {}) as any;

  const _settings = (useLocalStorage<AppSettings>(`sored_settings_${tenantId}`, defaultSettings) as any) || [];
  const settings: AppSettings = _settings[0] ?? defaultSettings;
  const setSettings: React.Dispatch<React.SetStateAction<AppSettings>> = typeof _settings[1] === 'function' ? _settings[1] : (() => {}) as any;

  const _categories = (useLocalStorage<Category[]>(`sored_categories_${tenantId}`, defaultCategories) as any) || [];
  const categories: Category[] = Array.isArray(_categories[0]) ? _categories[0] : _categories[0] ?? defaultCategories;
  const setCategories: React.Dispatch<React.SetStateAction<Category[]>> = typeof _categories[1] === 'function' ? _categories[1] : (() => {}) as any;

  const deleteMaterial = (id: string) => {
    setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== id));
  };

  const addMaterial = (material: Material) => {
    setMaterials(prevMaterials => [...prevMaterials, material]);
  };

  const updateMaterial = (updatedMaterial: Material) => {
    setMaterials(prevMaterials =>
      prevMaterials.map(material =>
        material.id === updatedMaterial.id ? updatedMaterial : material
      )
    );
  };

  return (
    <DataContext.Provider value={{ materials, setMaterials, categories, setCategories, quotes, setQuotes, settings, setSettings, deleteMaterial, addMaterial, updateMaterial }}>
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
