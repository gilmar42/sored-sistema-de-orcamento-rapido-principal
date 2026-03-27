
export type WeightUnit = 'kg' | 'g';

export interface Material {
  id: string;
  name: string;
  description: string;
  categoryId: string; // Adicionado para categorização
  unitWeight: number;
  unit: WeightUnit; // Add unit property
  unitCost: number; // in R$
  components: ProductComponent[];
  diameterValue?: number;
  diameterUnit?: 'mm' | 'cm' | 'in' | '';
  lengthValue?: number;
  lengthUnit?: 'mm' | 'cm' | 'in' | '';
  widthValue?: number;
  widthUnit?: 'mm' | 'cm' | 'in' | '';
}

export interface ProductComponent {
  name: string;
  unitWeight: number;
  unit: WeightUnit; // Add unit property
  unitCost: number; // in R$
  diameterValue?: number;
  rawDiameterInput?: string; // Adicionado para armazenar a entrada bruta do usuário
  diameterUnit?: 'mm' | 'in' | ''; // Mantém mm e polegadas (in) conforme solicitado
  lengthValue?: number;
  rawLengthInput?: string; // Adicionado para armazenar a entrada bruta do usuário
  lengthUnit?: 'mm' | 'cm' | ''; // Mantém mm e centímetros conforme solicitado
  widthValue?: number;
  rawWidthInput?: string; // Adicionado para armazenar a entrada bruta do usuário
  id: string;
  widthUnit?: 'mm' | 'cm' | ''; // Adiciona campos de largura com unidades solicitadas
  // Accept legacy and normalized shapes for sizeValue
  sizeValue?: any;
  sizeUnit?: string;
}

export interface QuoteItem {
  materialId: string;
  quantity: number;
}

export interface Quote {
  id: string;
  date: string;
  clientName: string;
  items: QuoteItem[];
  laborCost: number;
  freightCost: number;
  profitMargin: number; // percentage
  isFreightEnabled?: boolean; // Add this line
}

export interface AppSettings {
  companyName: string;
  companyContact: string;
  companyLogo: string; // base64 string
  defaultTax: number; // percentage (not used in current logic but in PRD)
}

export interface CalculatedCosts {
  materialCost: number;
  totalGrossCost: number;
  indirectCosts: number;
  freightCost: number; // Adicionado para separar do indirectCosts
  totalProjectCost: number;
  totalManufacturingCostPerItem: number; // Novo campo para o custo total de fabricação por item
  profitValue: number;
  finalValue: number;
  totalWeight: number;
}

// New types for SaaS Authentication
export interface User {
  id: string;
  email: string;
  passwordHash: string; // "Hashed" for simulation
  tenantId: string;
}

export interface Tenant {
  id: string;
  companyName: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  document: string; // CPF ou CNPJ
  notes: string;
  createdAt: string;
}
