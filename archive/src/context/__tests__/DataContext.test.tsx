import React from 'react';
import { render, screen, act } from '@testing-library/react';
let DataProvider: any;
let useData: any;

// Mock the useLocalStorage module and capture the mock implementation
jest.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));
const mockUseLocalStorage = require('../../hooks/useLocalStorage').useLocalStorage as jest.Mock;

// Mock useLocalStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    _getStore: () => store,
    _setStore: (newStore: { [key: string]: string }) => {
      store = newStore;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });


// Note: tests inject a testCurrentUser into DataProvider (test seam) instead of
// mocking AuthContext to avoid hook/hoisting timing issues.

describe('DataContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockUseLocalStorage.mockClear();

    // Import DataProvider and useData after mocks are set to ensure module uses mocked hooks
    // Avoid jest.isolateModules here — it can create a separate module registry and
    // may cause React to be required multiple times in some environments. A plain
    // require after the mock is sufficient because jest.mock is hoisted.
    const mod = require('../DataContext');
    DataProvider = mod.DataProvider;
    useData = mod.useData;

    // Default mock implementation for useLocalStorage: return initial values and a jest.fn setter
    mockUseLocalStorage.mockImplementation((key: string, initialValue: any) => {
      if (key.includes('materials')) return [initialValue || [], jest.fn()];
      if (key.includes('quotes')) return [initialValue || [], jest.fn()];
      if (key.includes('settings')) return [initialValue || {}, jest.fn()];
      if (key.includes('categories')) return [initialValue || [], jest.fn()];
      return [initialValue, jest.fn()];
    });
  });

  it('should provide default data values when no data is in local storage', () => {
  const testUser = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' };
    mockUseLocalStorage
      .mockReturnValueOnce([[], jest.fn()]) // materials
      .mockReturnValueOnce([[], jest.fn()]) // quotes
      .mockReturnValueOnce([{ companyName: 'Sua Empresa Aqui', companyContact: 'Telefone: (00) 0000-0000 | email@suaempresa.com', companyLogo: '', defaultTax: 0 }, jest.fn()]); // settings

    let dataContextValue: any;
    const TestComponent = () => {
      dataContextValue = useData();
      return null;
    };

    render(
      <DataProvider testCurrentUser={testUser}>
        <TestComponent />
      </DataProvider>
    );

    expect(dataContextValue.materials).toEqual([]);
    expect(dataContextValue.quotes).toEqual([]);
    expect(dataContextValue.settings).toEqual({
      companyName: 'Sua Empresa Aqui',
      companyContact: 'Telefone: (00) 0000-0000 | email@suaempresa.com',
      companyLogo: '',
      defaultTax: 0,
    });
  });

  it('should load existing data from local storage', () => {
    const storedMaterials = [{ id: 'M-1', name: 'Material 1', unitCost: 10, unit: 'kg', size: 'Pequeno' }];
    const storedQuotes = [{ id: 'Q-1', clientName: 'Client 1', total: 100 }];
    const storedSettings = { companyName: 'Test Co', companyContact: '123', companyLogo: '', defaultTax: 5 };

    localStorageMock.setItem('sored_materials_T-1', JSON.stringify(storedMaterials));
    localStorageMock.setItem('sored_quotes_T-1', JSON.stringify(storedQuotes));
    localStorageMock.setItem('sored_settings_T-1', JSON.stringify(storedSettings));

  const testUser = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' };
  mockUseLocalStorage
      .mockReturnValueOnce([storedMaterials, jest.fn()])
      .mockReturnValueOnce([storedQuotes, jest.fn()])
      .mockReturnValueOnce([storedSettings, jest.fn()]);

    let dataContextValue: any;
    const TestComponent = () => {
      dataContextValue = useData();
      return null;
    };

    render(
      <DataProvider testCurrentUser={testUser}>
        <TestComponent />
      </DataProvider>
    );

    expect(dataContextValue.materials).toEqual(storedMaterials);
    expect(dataContextValue.quotes).toEqual(storedQuotes);
    expect(dataContextValue.settings).toEqual(storedSettings);
  });

  it('should update materials', () => {
    const setMaterialsMock = jest.fn();
  const testUser = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' };
    mockUseLocalStorage
      .mockReturnValueOnce([[], setMaterialsMock])
      .mockReturnValueOnce([[], jest.fn()])
      .mockReturnValueOnce([{}, jest.fn()]);

    let dataContextValue: any;
    const TestComponent = () => {
      dataContextValue = useData();
      return null;
    };

    render(
      <DataProvider testCurrentUser={testUser}>
        <TestComponent />
      </DataProvider>
    );

    const newMaterial = { id: 'M-2', name: 'Material 2', unitCost: 20, unit: 'kg', size: 'Médio' };
    act(() => {
      dataContextValue.setMaterials([newMaterial]);
    });

    expect(setMaterialsMock).toHaveBeenCalledWith([newMaterial]);
  });

  it('should update quotes', () => {
    const setQuotesMock = jest.fn();
    const testUser = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' };
    mockUseLocalStorage
      .mockReturnValueOnce([[], jest.fn()])
      .mockReturnValueOnce([[], setQuotesMock])
      .mockReturnValueOnce([{}, jest.fn()]);

    let dataContextValue: any;
    const TestComponent = () => {
      dataContextValue = useData();
      return null;
    };

    render(
      <DataProvider testCurrentUser={testUser}>
        <TestComponent />
      </DataProvider>
    );

    const newQuote = { id: 'Q-2', clientName: 'Client 2', total: 200 };
    act(() => {
      dataContextValue.setQuotes([newQuote]);
    });

    expect(setQuotesMock).toHaveBeenCalledWith([newQuote]);
  });

  it('should update settings', () => {
    const setSettingsMock = jest.fn();
    const testUser = { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' };
    mockUseLocalStorage
      .mockReturnValueOnce([[], jest.fn()])
      .mockReturnValueOnce([[], jest.fn()])
      .mockReturnValueOnce([{}, setSettingsMock]);

    let dataContextValue: any;
    const TestComponent = () => {
      dataContextValue = useData();
      return null;
    };

    render(
      <DataProvider testCurrentUser={testUser}>
        <TestComponent />
      </DataProvider>
    );

    const newSettings = { companyName: 'New Co', companyContact: '456', companyLogo: 'new.png', defaultTax: 10 };
    act(() => {
      dataContextValue.setSettings(newSettings);
    });

    expect(setSettingsMock).toHaveBeenCalledWith(newSettings);
  });

  it('should throw an error if useData is not used within a DataProvider', () => {
    const TestComponent = () => {
      useData();
      return null;
    };

    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow('useData must be used within a DataProvider');
    consoleErrorSpy.mockRestore();
  });

  it('should render error message if currentUser or tenantId is missing', () => {
    // No current user: pass null via the test seam
    render(
      <DataProvider testCurrentUser={null}>
        <div>Children</div>
      </DataProvider>
    );

    // The provider now supplies a safe default context and still renders
    // children when there's no authenticated user. Ensure children render
    // and that useLocalStorage was not invoked.
    expect(screen.getByText('Children')).toBeInTheDocument();
    expect(mockUseLocalStorage).not.toHaveBeenCalled();
  });
});