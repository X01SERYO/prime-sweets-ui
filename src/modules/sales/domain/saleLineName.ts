export function groupSaleItems<T extends { productId: string }>(items: T[]): T[][] {
  const groups: T[][] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last[0].productId === item.productId) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }
  return groups;
}

export function composeSaleLineName(catalogName: string, variant: string): string {
  const base = catalogName.trim();
  const extra = sentence(variant);
  if (!base) {
    return extra;
  }
  return extra ? `${base} ${extra}` : base;
}

export function addedSaleLineName(catalogName: string, itemName: string): string | null {
  const base = catalogName.trim();
  if (!base || itemName === base || !itemName.startsWith(base)) {
    return null;
  }
  const extra = sentence(itemName.slice(base.length));
  return extra || null;
}

function sentence(value: string): string {
  const text = value.trim().toLocaleLowerCase('es-CO');
  if (!text) {
    return '';
  }
  return text.charAt(0).toLocaleUpperCase('es-CO') + text.slice(1);
}

export function previewLineTotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * quantity * 100) / 100;
}
