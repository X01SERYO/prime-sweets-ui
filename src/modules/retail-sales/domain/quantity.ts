export function isRetailQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1;
}

export function parseRetailQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const quantity = Number(trimmed);
  return isRetailQuantity(quantity) ? quantity : null;
}
