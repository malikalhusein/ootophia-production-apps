export interface InitialCosts {
  greenBeansPrice: number;
  greenBeansShipping: number;
  roastingService: number;
  roastingServiceType: "perKg" | "perBatch";
  roastingTransport: number;
}

export interface RoastLog {
  id: string;
  date: string;
  inputWeight: number;
  outputWeight: number;
}

export interface BeanAllocation {
  rnd: number;
  promo: number;
}

export interface CoffeeIdentity {
  origin: string;
  process: string;
  variety: string;
  processor: string;
  roaster: string;
  tastingNotes: string;
}

export interface TeaIdentity {
  origin: string;
  teaType: "green" | "black" | "oolong" | "white" | "herbal" | "pu-erh" | "";
  teaGrade: "premium" | "standard" | "economy" | "";
  harvestSeason: "spring" | "summer" | "autumn" | "winter" | "";
  processingMethod: "orthodox" | "ctc" | "blending" | "aging" | "fermentation" | "";
  supplier: string;
  tastingNotes: string;
}

export interface Lineup {
  id: string;
  name: string;
  identity: CoffeeIdentity;
  teaIdentity?: TeaIdentity;
  purchaseDate: string;
  initialWeight: number;
  costs: InitialCosts;
  roastLogs: RoastLog[];
  allocations: BeanAllocation;
  allocationsUsed: BeanAllocation;
  batchId?: string | null;
  lineupCode?: string | null;
  category: "coffee" | "tea";
}

export interface Product {
  id: string;
  lineupId: string;
  name: string;
  netWeight: number;
  packagingCost: number;
  labelCost: number;
  marketingCost: number;
  marginPercentage: number;
  stock: number;
  stockThreshold: number;
}

export interface Bundle {
  id: string;
  name: string;
  productIds: string[];
  customPrice: number;
}

export interface Transaction {
  id: string;
  date: string;
  status: "sale" | "promo" | "rnd" | "bonus";
  productId?: string;
  bundleId?: string;
  lineupId?: string;
  quantity: number;
  totalValue: number;
  description: string;
  customerName?: string;
}

export interface AppSettings {
  businessName: string;
  logo: string;
}
