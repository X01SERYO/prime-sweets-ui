export function addedSaleLineName(catalogName: string, itemName: string): string | null {
  const base = catalogName.trim();
  if (!base || itemName === base || !itemName.startsWith(base)) {
    return null;
  }
  const extra = itemName.slice(base.length);
  return extra.trim() ? extra : null;
}

export function previewLineTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}
