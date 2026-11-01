export function suggestedSalePrice(wholesaleCost: number | null, marginPercent: number): number | null {
  if (wholesaleCost === null || !Number.isFinite(marginPercent)) {
    return null;
  }
  return Math.round(wholesaleCost * (1 + marginPercent / 100) * 100) / 100;
}

export function realMarginPercent(price: number | null, cost: number | null): number | null {
  if (price === null || cost === null || cost === 0) {
    return null;
  }
  return Math.round(((price - cost) / cost) * 10000) / 100;
}
