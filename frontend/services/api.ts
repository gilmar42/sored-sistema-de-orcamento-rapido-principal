
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {

  // Token não é mais gerenciado no frontend, cookies httpOnly são usados

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include', // cookies httpOnly
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }

  // Auth
  async signup(companyName: string, email: string, password: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ companyName, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  async refresh() {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Materials
  async getMaterials() {
    return this.request('/materials');
  }

  async createMaterial(material: any) {
    return this.request('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  }

  async updateMaterial(id: string, material: any) {
    return this.request(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    });
  }

  async deleteMaterial(id: string) {
    return this.request(`/materials/${id}`, { method: 'DELETE' });
  }

  // Quotes
  async getQuotes() {
    return this.request('/quotes');
  }

  async createQuote(quote: any) {
    return this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(quote),
    });
  }

  async updateQuote(id: string, quote: any) {
    return this.request(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quote),
    });
  }

  async deleteQuote(id: string) {
    return this.request(`/quotes/${id}`, { method: 'DELETE' });
  }

  // Clients
  async getClients() {
    return this.request('/clients');
  }

  async createClient(client: any) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: string, client: any) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(category: any) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: any) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }


}

export const apiService = new ApiService();
