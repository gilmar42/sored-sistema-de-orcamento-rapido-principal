// Simple mock for apiService to avoid network calls in tests.
export const apiService = {
  signup: async (companyName, email, password) => {
    if (email === 'existing@example.com') return {};
    return { user: { id: 'U-2', email, tenantId: 'T-2' } };
  },
  login: async (email, password) => {
    if (email === 'test@example.com' && password === 'password123') {
      return { user: { id: 'U-1', email, tenantId: 'T-1' } };
    }
    return {};
  },
  verifyToken: async () => ({}),
  getMaterials: async () => [],
  createMaterial: async (material: any) => material,
  updateMaterial: async (_id: string, material: any) => material,
  deleteMaterial: async () => ({}),
  getQuotes: async () => [],
  createQuote: async (quote: any) => quote,
  updateQuote: async (_id: string, quote: any) => quote,
  deleteQuote: async () => ({}),
  getClients: async () => [],
  createClient: async (client: any) => client,
  updateClient: async (_id: string, client: any) => client,
  deleteClient: async () => ({}),
  getCategories: async () => [],
  createCategory: async (category: any) => category,
  updateCategory: async (_id: string, category: any) => category,
  deleteCategory: async () => ({}),
  getSettings: async () => ({}),
  updateSettings: async (settings: any) => settings,
  setToken: () => {},
  clearToken: () => {},

};
