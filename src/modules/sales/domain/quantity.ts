export function isSellableQuantity(quantity: number): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return false;
  }
  const thousandths = Math.round(quantity * 1000);
  return Math.abs(quantity * 1000 - thousandths) < 1e-6;
}
