export function formatQuantity(value: number, decimals: number): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return rounded.toLocaleString('es-CO', {
    minimumFractionDigits: decimals === 1 ? 1 : 0,
    maximumFractionDigits: decimals
  });
}
