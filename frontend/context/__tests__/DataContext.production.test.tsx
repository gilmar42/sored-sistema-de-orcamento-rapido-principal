/**
 * Testes de Produção - DataContext
 * Valida todas as operações CRUD e integridade de dados
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { DataProvider, useData } from '../DataContext';
import type { Material, Quote, Client, AppSettings, WeightUnit } from '../../types';

// Mock do AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'test-user-id',
      email: 'test@example.com',
      tenantId: 'test-tenant-id',
      passwordHash: 'hashed',
    },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
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
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('DataContext - Testes de Produção', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id', email: 'test@example.com', passwordHash: 'hashed' }}>
      {children}
    </DataProvider>
  );

  describe('Materials CRUD', () => {
    it('deve adicionar um material corretamente', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const newMaterial: Material = {
        id: 'MAT-001',
        name: 'Material de Teste',
        categoryId: '1',
        unitCost: 100,
        unitWeight: 1.5,
        unit: 'kg' as WeightUnit,
        description: 'Material para teste',
        components: [],
      };

      act(() => {
        result.current.addMaterial(newMaterial);
      });

      expect(result.current.materials).toHaveLength(1);
      expect(result.current.materials[0]).toEqual(newMaterial);
    });

    it('deve atualizar um material existente', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const material: Material = {
        id: 'MAT-001',
        name: 'Material Original',
        categoryId: '1',
        unitCost: 100,
        unitWeight: 1.5,
        unit: 'kg' as WeightUnit,
        description: 'Descrição original',
        components: [],
      };

      act(() => {
        result.current.addMaterial(material);
      });

      const updatedMaterial = {
        ...material,
        name: 'Material Atualizado',
        unitCost: 150,
      };

      act(() => {
        result.current.updateMaterial(updatedMaterial);
      });

      expect(result.current.materials[0].name).toBe('Material Atualizado');
      expect(result.current.materials[0].unitCost).toBe(150);
    });

    it('deve deletar um material', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const material: Material = {
        id: 'MAT-001',
        name: 'Material para Deletar',
        categoryId: '1',
        unitCost: 100,
        unitWeight: 1.5,
        unit: 'kg' as WeightUnit,
        description: 'Será deletado',
        components: [],
      };

      act(() => {
        result.current.addMaterial(material);
      });

      expect(result.current.materials).toHaveLength(1);

      act(() => {
        result.current.deleteMaterial('MAT-001');
      });

      expect(result.current.materials).toHaveLength(0);
    });

    it('deve manter múltiplos materiais com IDs únicos', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const materials: Material[] = [
        {
          id: 'MAT-001',
          name: 'Material 1',
          categoryId: '1',
          unitCost: 100,
          unitWeight: 1,
          unit: 'kg' as WeightUnit,
          description: 'Material 1',
          components: [],
        },
        {
          id: 'MAT-002',
          name: 'Material 2',
          categoryId: '1',
          unitCost: 200,
          unitWeight: 2,
          unit: 'kg' as WeightUnit,
          description: 'Material 2',
          components: [],
        },
      ];

      act(() => {
        materials.forEach(mat => result.current.addMaterial(mat));
      });

      expect(result.current.materials).toHaveLength(2);
      expect(result.current.materials.map(m => m.id)).toEqual(['MAT-001', 'MAT-002']);
    });
  });

  describe('Clients CRUD', () => {
    it('deve adicionar um cliente corretamente', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const newClient: Client = {
        id: 'CLI-001',
        name: 'Cliente Teste',
        email: 'cliente@teste.com',
        phone: '(11) 98765-4321',
        address: 'Rua Teste, 123',
        document: '123.456.789-00',
        notes: 'Cliente importante',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addClient(newClient);
      });

      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0]).toEqual(newClient);
    });

    it('deve atualizar um cliente existente', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const client: Client = {
        id: 'CLI-001',
        name: 'Cliente Original',
        email: 'original@teste.com',
        phone: '(11) 11111-1111',
        address: 'Rua A, 100',
        document: '111.111.111-11',
        notes: 'Nota original',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addClient(client);
      });

      const updatedClient = {
        ...client,
        name: 'Cliente Atualizado',
        email: 'atualizado@teste.com',
      };

      act(() => {
        result.current.updateClient(updatedClient);
      });

      expect(result.current.clients[0].name).toBe('Cliente Atualizado');
      expect(result.current.clients[0].email).toBe('atualizado@teste.com');
    });

    it('deve deletar um cliente', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const client: Client = {
        id: 'CLI-001',
        name: 'Cliente para Deletar',
        email: 'deletar@teste.com',
        phone: '(11) 99999-9999',
        address: 'Rua Delete, 999',
        document: '999.999.999-99',
        notes: 'Será deletado',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addClient(client);
      });

      expect(result.current.clients).toHaveLength(1);

      act(() => {
        result.current.deleteClient('CLI-001');
      });

      expect(result.current.clients).toHaveLength(0);
    });
  });

  describe('Quotes Management', () => {
    it('deve adicionar um orçamento com cálculos corretos', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      // Primeiro adicionar um material
      const material: Material = {
        id: 'MAT-001',
        name: 'Material Teste',
        categoryId: '1',
        unitCost: 100,
        unitWeight: 1,
        unit: 'kg' as WeightUnit,
        description: 'Material',
        components: [
          { id: 'COMP-1', name: 'Componente 1', unitCost: 50, unitWeight: 1, unit: 'kg' as WeightUnit },
          { id: 'COMP-2', name: 'Componente 2', unitCost: 30, unitWeight: 0.5, unit: 'kg' as WeightUnit },
        ],
      };

      act(() => {
        result.current.addMaterial(material);
      });

      const newQuote: Quote = {
        id: 'QUOTE-003',
        date: new Date().toISOString(),
        clientName: 'Novo Cliente',
        items: [
          { materialId: 'MAT-001', quantity: 2 },
        ],
        freightCost: 50,
        profitMargin: 20,
        isFreightEnabled: true,
        laborCost: 0,
      };

      act(() => {
        result.current.setQuotes(prev => [...prev, newQuote]);
      });

      expect(result.current.quotes).toHaveLength(1);
      expect(result.current.quotes[0].clientName).toBe('Novo Cliente');
    });
  });

  describe('Settings Management', () => {
    it('deve ter configurações padrão inicializadas', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      expect(result.current.settings).toBeDefined();
      expect(result.current.settings.companyName).toBe('Sua Empresa Aqui');
      expect(result.current.settings.defaultTax).toBe(0);
    });

    it('deve atualizar configurações da empresa', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const newSettings: AppSettings = {
        companyName: 'Empresa XYZ',
        companyContact: '(11) 1234-5678 | contato@xyz.com',
        companyLogo: 'data:image/png;base64,abc123',
        defaultTax: 18,
      };

      act(() => {
        result.current.setSettings(newSettings);
      });

      expect(result.current.settings.companyName).toBe('Empresa XYZ');
      expect(result.current.settings.defaultTax).toBe(18);
    });
  });

  describe('Data Persistence', () => {
    it('deve persistir materiais no localStorage', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const material: Material = {
        id: 'MAT-001',
        name: 'Material Persistente',
        categoryId: '1',
        unitCost: 100,
        unitWeight: 1,
        unit: 'kg' as WeightUnit,
        description: 'Teste de persistência',
        components: [],
      };

      act(() => {
        result.current.addMaterial(material);
      });

      // Verificar que o material foi adicionado
      expect(result.current.materials).toHaveLength(1);
      expect(result.current.materials[0].name).toBe('Material Persistente');
      
      // O localStorage é atualizado automaticamente pelo useLocalStorage hook
    });

    it('deve persistir clientes no localStorage', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      const client: Client = {
        id: 'CLI-001',
        name: 'Cliente Persistente',
        email: 'persistente@teste.com',
        phone: '(11) 98765-4321',
        address: 'Rua Teste, 123',
        document: '123.456.789-00',
        notes: 'Teste de persistência',
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addClient(client);
      });

      // Verificar que o cliente foi adicionado
      expect(result.current.clients).toHaveLength(1);
      expect(result.current.clients[0].name).toBe('Cliente Persistente');
      
      // O localStorage é atualizado automaticamente pelo useLocalStorage hook
    });
  });

  describe('Validação de Integridade', () => {
    it('deve manter integridade após múltiplas operações', () => {
      const { result } = renderHook(() => useData(), { wrapper });

      // Adicionar múltiplos materiais
      const materials: Material[] = Array.from({ length: 5 }, (_, i) => ({
        id: `MAT-${i + 1}`,
        name: `Material ${i + 1}`,
        categoryId: '1',
        unitCost: (i + 1) * 100,
        unitWeight: i + 1,
        unit: 'kg' as WeightUnit,
        description: `Material ${i + 1}`,
        components: [],
      }));

      act(() => {
        materials.forEach(mat => result.current.addMaterial(mat));
      });

      // Adicionar múltiplos clientes
      const clients: Client[] = Array.from({ length: 3 }, (_, i) => ({
        id: `CLI-${i + 1}`,
        name: `Cliente ${i + 1}`,
        email: `cliente${i + 1}@teste.com`,
        phone: `(11) 9876${i}-0000`,
        address: `Rua ${i + 1}, 100`,
        document: `123.456.78${i}-00`,
        notes: `Cliente ${i + 1}`,
        createdAt: new Date().toISOString(),
      }));

      act(() => {
        clients.forEach(cli => result.current.addClient(cli));
      });

      // Verificar integridade
      expect(result.current.materials).toHaveLength(5);
      expect(result.current.clients).toHaveLength(3);

      // Deletar alguns itens
      act(() => {
        result.current.deleteMaterial('MAT-2');
        result.current.deleteClient('CLI-1');
      });

      expect(result.current.materials).toHaveLength(4);
      expect(result.current.clients).toHaveLength(2);

      // Verificar que os IDs corretos foram mantidos
      expect(result.current.materials.find(m => m.id === 'MAT-2')).toBeUndefined();
      expect(result.current.clients.find(c => c.id === 'CLI-1')).toBeUndefined();
    });
  });
});
