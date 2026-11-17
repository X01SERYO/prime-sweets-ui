export function sanitizeQuantityInput(value: string): string {
  const compact = value.replace(/\s/g, '').replace(/[^\d.,]/g, '');
  const separatorAt = compact.search(/[.,]/);
  if (separatorAt < 0) {
    return compact;
  }
  const separator = compact[separatorAt];
  const whole = compact.slice(0, separatorAt).replace(/\D/g, '');
  const fraction = (compact.slice(separatorAt + 1).match(/^\d*/)?.[0] ?? '').slice(0, 3);
  return `${whole}${separator}${fraction}`;
}

export function formatQuantityInput(quantity: number, separator: ',' | '.' = '.'): string {
  const text = String(Math.round(quantity * 1000) / 1000);
  return separator === ',' ? text.replace('.', ',') : text;
}

export function parseQuantity(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, '');
  if (!/^(\d+([.,]\d{0,3})?|[.,]\d{1,3})$/.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized.endsWith('.') ? normalized.slice(0, -1) : normalized);
  if (!isSellableQuantity(parsed)) {
    return null;
  }
  return Math.round(parsed * 1000) / 1000;
}

export function isSellableQuantity(quantity: number): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return false;
  }
  const thousandths = Math.round(quantity * 1000);
  return Math.abs(quantity * 1000 - thousandths) < 1e-6;
}
