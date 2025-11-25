import { Lineup, Product, Transaction } from "@/types";

export function calculateTotalInitialCost(lineup: Lineup): number {
  const { costs, initialWeight } = lineup;
  const greenBeansCost = (costs.greenBeansPrice * initialWeight) / 1000; // Convert grams to kg
  return (
    greenBeansCost +
    costs.greenBeansShipping +
    costs.roastingService +
    costs.roastingTransport
  );
}

export function calculateTotalRoastedOutput(lineup: Lineup): number {
  return lineup.roastLogs.reduce((sum, log) => sum + log.outputWeight, 0);
}

export function calculateShrinkagePercentage(lineup: Lineup): number {
  const totalInput = lineup.roastLogs.reduce((sum, log) => sum + log.inputWeight, 0);
  const totalOutput = calculateTotalRoastedOutput(lineup);
  if (totalInput === 0) return 0;
  return ((totalInput - totalOutput) / totalInput) * 100;
}

export function calculateCostPerGram(lineup: Lineup): number {
  const totalCost = calculateTotalInitialCost(lineup);
  const weightForSale = calculateWeightForSale(lineup);
  if (weightForSale === 0) return 0;
  return totalCost / weightForSale;
}

export function calculateWeightForSale(lineup: Lineup): number {
  const totalOutput = calculateTotalRoastedOutput(lineup);
  return totalOutput - lineup.allocations.rnd - lineup.allocations.promo;
}

export function calculateProductHPP(
  product: Product,
  costPerGram: number
): {
  beanCost: number;
  totalHPP: number;
  sellingPrice: number;
} {
  const beanCost = product.netWeight * costPerGram;
  const totalHPP =
    beanCost +
    product.packagingCost +
    product.labelCost +
    product.marketingCost;
  const sellingPrice = totalHPP * (1 + product.marginPercentage / 100);
  
  return {
    beanCost,
    totalHPP,
    sellingPrice,
  };
}

export function calculateWeightAssignedToProducts(
  lineup: Lineup,
  products: Product[]
): number {
  return products
    .filter((p) => p.lineupId === lineup.id)
    .reduce((sum, p) => sum + p.netWeight * p.stock, 0);
}

export function calculateAllocationUsed(
  lineup: Lineup,
  transactions: Transaction[],
  type: "rnd" | "promo"
): number {
  return transactions
    .filter((t) => t.lineupId === lineup.id && t.status === type)
    .reduce((sum, t) => sum + t.quantity, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams.toFixed(0)} g`;
}
