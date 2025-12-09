/**
 * Calculation Service
 * 
 * Centralized calculation logic for consistent and accurate pricing/costing.
 * All monetary calculations go through this service to minimize miscalculation risks.
 */

import { Lineup, Product, Transaction } from "@/types";

// Precision helpers to avoid floating point errors
const PRECISION = 4;

function round(value: number, decimals: number = PRECISION): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function safeNumber(value: unknown): number {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculate total input weight from all roast logs
 */
export function getTotalRoastingInput(lineup: Lineup): number {
  return lineup.roastLogs.reduce((sum, log) => sum + safeNumber(log.inputWeight), 0);
}

/**
 * Calculate total output weight from all roast logs
 */
export function getTotalRoastedOutput(lineup: Lineup): number {
  return lineup.roastLogs.reduce((sum, log) => sum + safeNumber(log.outputWeight), 0);
}

/**
 * Calculate shrinkage percentage during roasting
 */
export function getShrinkagePercentage(lineup: Lineup): number {
  const totalInput = getTotalRoastingInput(lineup);
  const totalOutput = getTotalRoastedOutput(lineup);
  if (totalInput === 0) return 0;
  return round(((totalInput - totalOutput) / totalInput) * 100, 2);
}

/**
 * Calculate green beans cost based on actual roasted input
 * Formula: (price per kg × total input weight) / 1000
 */
export function getGreenBeansCost(lineup: Lineup): number {
  const totalInput = getTotalRoastingInput(lineup);
  const pricePerKg = safeNumber(lineup.costs.greenBeansPrice);
  return round((pricePerKg * totalInput) / 1000);
}

/**
 * Calculate roasting service cost based on actual batch weights
 * Formula: (service rate per kg × total input weight) / 1000
 */
export function getRoastingServiceCost(lineup: Lineup): number {
  const totalInput = getTotalRoastingInput(lineup);
  const serviceRatePerKg = safeNumber(lineup.costs.roastingService);
  return round((serviceRatePerKg * totalInput) / 1000);
}

/**
 * Calculate total initial production cost
 * Includes: green beans + shipping + roasting service + transport
 */
export function getTotalProductionCost(lineup: Lineup): number {
  const greenBeansCost = getGreenBeansCost(lineup);
  const shippingCost = safeNumber(lineup.costs.greenBeansShipping);
  const roastingCost = getRoastingServiceCost(lineup);
  const transportCost = safeNumber(lineup.costs.roastingTransport);
  
  return round(greenBeansCost + shippingCost + roastingCost + transportCost);
}

/**
 * Calculate weight available for sale (after allocations)
 * Formula: total output - RnD allocation - Promo allocation
 */
export function getWeightForSale(lineup: Lineup): number {
  const totalOutput = getTotalRoastedOutput(lineup);
  const rndAllocation = safeNumber(lineup.allocations.rnd);
  const promoAllocation = safeNumber(lineup.allocations.promo);
  
  return Math.max(0, round(totalOutput - rndAllocation - promoAllocation));
}

/**
 * Calculate cost per gram of roasted beans for sale
 * Formula: total production cost / weight for sale
 */
export function getCostPerGram(lineup: Lineup): number {
  const totalCost = getTotalProductionCost(lineup);
  const weightForSale = getWeightForSale(lineup);
  
  if (weightForSale === 0) return 0;
  return round(totalCost / weightForSale);
}

/**
 * Calculate product HPP (Harga Pokok Produksi / Cost of Goods)
 * Formula: (bean cost) + packaging + label + marketing
 */
export function getProductHPP(product: Product, costPerGram: number): {
  beanCost: number;
  packagingTotal: number;
  totalHPP: number;
  sellingPrice: number;
  marginAmount: number;
  profitPerUnit: number;
} {
  const beanCost = round(safeNumber(product.netWeight) * safeNumber(costPerGram));
  const packagingCost = safeNumber(product.packagingCost);
  const labelCost = safeNumber(product.labelCost);
  const marketingCost = safeNumber(product.marketingCost);
  
  const packagingTotal = round(packagingCost + labelCost + marketingCost);
  const totalHPP = round(beanCost + packagingTotal);
  
  const marginPercentage = safeNumber(product.marginPercentage);
  const marginMultiplier = 1 + (marginPercentage / 100);
  const sellingPrice = round(totalHPP * marginMultiplier, 0); // Round to whole number for pricing
  
  const marginAmount = round(sellingPrice - totalHPP);
  const profitPerUnit = marginAmount;
  
  return {
    beanCost,
    packagingTotal,
    totalHPP,
    sellingPrice,
    marginAmount,
    profitPerUnit,
  };
}

/**
 * Calculate total weight assigned to products
 */
export function getWeightAssignedToProducts(lineup: Lineup, products: Product[]): number {
  const lineupProducts = products.filter(p => p.lineupId === lineup.id);
  return round(lineupProducts.reduce((sum, p) => {
    return sum + (safeNumber(p.netWeight) * safeNumber(p.stock));
  }, 0));
}

/**
 * Calculate remaining beans available for new products
 */
export function getAvailableBeans(lineup: Lineup, products: Product[]): number {
  const weightForSale = getWeightForSale(lineup);
  const weightAssigned = getWeightAssignedToProducts(lineup, products);
  return Math.max(0, round(weightForSale - weightAssigned));
}

/**
 * Calculate allocation usage from transactions
 */
export function getAllocationUsage(
  lineup: Lineup,
  transactions: Transaction[],
  type: "rnd" | "promo"
): number {
  const lineupTransactions = transactions.filter(
    t => t.lineupId === lineup.id && t.status === type
  );
  return round(lineupTransactions.reduce((sum, t) => sum + safeNumber(t.quantity), 0));
}

/**
 * Calculate remaining allocation quota
 */
export function getRemainingAllocation(
  lineup: Lineup,
  transactions: Transaction[],
  type: "rnd" | "promo"
): number {
  const allocated = safeNumber(lineup.allocations[type]);
  const used = getAllocationUsage(lineup, transactions, type);
  return Math.max(0, round(allocated - used));
}

/**
 * Calculate transaction total value
 */
export function getTransactionValue(
  transaction: Transaction,
  products: Product[],
  lineups: Lineup[]
): number {
  if (transaction.productId) {
    const product = products.find(p => p.id === transaction.productId);
    if (product) {
      const lineup = lineups.find(l => l.id === product.lineupId);
      if (lineup) {
        const costPerGram = getCostPerGram(lineup);
        const { sellingPrice } = getProductHPP(product, costPerGram);
        return round(sellingPrice * safeNumber(transaction.quantity), 0);
      }
    }
  }
  return 0;
}

/**
 * Batch calculate multiple product HPPs for efficiency
 */
export function batchCalculateProductHPPs(
  products: Product[],
  lineups: Lineup[]
): Map<string, ReturnType<typeof getProductHPP>> {
  const results = new Map<string, ReturnType<typeof getProductHPP>>();
  
  // Pre-calculate cost per gram for each lineup
  const lineupCosts = new Map<string, number>();
  lineups.forEach(lineup => {
    lineupCosts.set(lineup.id, getCostPerGram(lineup));
  });
  
  // Calculate HPP for each product
  products.forEach(product => {
    const costPerGram = lineupCosts.get(product.lineupId) || 0;
    results.set(product.id, getProductHPP(product, costPerGram));
  });
  
  return results;
}

/**
 * Validate lineup data integrity
 */
export function validateLineupData(lineup: Lineup): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!lineup.id) errors.push("Lineup ID is missing");
  if (!lineup.name) errors.push("Lineup name is required");
  if (safeNumber(lineup.costs.greenBeansPrice) < 0) errors.push("Green beans price cannot be negative");
  if (safeNumber(lineup.costs.roastingService) < 0) errors.push("Roasting service cost cannot be negative");
  
  lineup.roastLogs.forEach((log, index) => {
    if (safeNumber(log.inputWeight) <= 0) {
      errors.push(`Roast log ${index + 1}: Input weight must be positive`);
    }
    if (safeNumber(log.outputWeight) < 0) {
      errors.push(`Roast log ${index + 1}: Output weight cannot be negative`);
    }
    if (safeNumber(log.outputWeight) > safeNumber(log.inputWeight)) {
      errors.push(`Roast log ${index + 1}: Output cannot exceed input weight`);
    }
  });
  
  const totalOutput = getTotalRoastedOutput(lineup);
  const totalAllocations = safeNumber(lineup.allocations.rnd) + safeNumber(lineup.allocations.promo);
  
  if (totalAllocations > totalOutput) {
    errors.push("Total allocations cannot exceed roasted output");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate product data integrity
 */
export function validateProductData(product: Product): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!product.id) errors.push("Product ID is missing");
  if (!product.name) errors.push("Product name is required");
  if (!product.lineupId) errors.push("Product must be linked to a lineup");
  if (safeNumber(product.netWeight) <= 0) errors.push("Net weight must be positive");
  if (safeNumber(product.marginPercentage) < 0) errors.push("Margin cannot be negative");
  if (safeNumber(product.stock) < 0) errors.push("Stock cannot be negative");
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
