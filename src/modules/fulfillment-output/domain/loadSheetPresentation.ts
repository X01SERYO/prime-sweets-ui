import type { LoadSheetLineModel } from '@/modules/fulfillment-output/domain/models/loadSheetLine';

export type LoadSheetSortKey = 'name' | 'sold' | 'gain' | 'qty';

export interface LoadSheetTotals {
  quantity: number;
  cost: number;
  sold: number;
  gain: number;
}

export interface LoadSheetProductRow {
  productId: string;
  brand: string;
  name: string;
  quantity: number;
  cost: number;
  sold: number;
  gain: number;
  unitCost: number | null;
  unitPrice: number | null;
  mixed: boolean;
  priceGroups: LoadSheetLineModel['priceGroups'];
}

export interface LoadSheetBrandGroup {
  name: string;
  quantity: number;
  cost: number;
  sold: number;
  gain: number;
  products: LoadSheetProductRow[];
}

const EMPTY: LoadSheetTotals = { quantity: 0, cost: 0, sold: 0, gain: 0 };

export function lineCost(line: LoadSheetLineModel): number {
  return line.totalPrice - line.profit;
}

export function marginRatio(gain: number, sold: number): number | null {
  if (!sold) {
    return null;
  }
  return gain / sold;
}

export function loadSheetTotals(rows: Array<Pick<LoadSheetProductRow, 'quantity' | 'cost' | 'sold' | 'gain'>>): LoadSheetTotals {
  return rows.reduce(
    (totals, row) => ({
      quantity: totals.quantity + row.quantity,
      cost: totals.cost + row.cost,
      sold: totals.sold + row.sold,
      gain: totals.gain + row.gain
    }),
    { ...EMPTY }
  );
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function toProductRows(lines: LoadSheetLineModel[]): LoadSheetProductRow[] {
  return lines.map(line => ({
    productId: line.productId,
    brand: line.brand?.trim() || '',
    name: line.name,
    quantity: line.quantity,
    cost: lineCost(line),
    sold: line.totalPrice,
    gain: line.profit,
    unitCost: line.wholesaleCost,
    unitPrice: line.wholesaleSalePrice,
    mixed: line.priceGroups.length > 1,
    priceGroups: line.priceGroups
  }));
}

export function filterProductRows(rows: LoadSheetProductRow[], query: string): LoadSheetProductRow[] {
  const terms = fold(query.trim()).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return rows;
  }
  return rows.filter(row => {
    const haystack = fold(`${row.brand} ${row.name}`);
    return terms.every(term => haystack.includes(term));
  });
}

function byName(left: { brand: string; name: string }, right: { brand: string; name: string }): number {
  return `${left.brand} ${left.name}`.localeCompare(`${right.brand} ${right.name}`, 'es');
}

export function sortProductRows(rows: LoadSheetProductRow[], sortKey: LoadSheetSortKey): LoadSheetProductRow[] {
  const copy = [...rows];
  copy.sort((left, right) => {
    if (sortKey === 'sold' && left.sold !== right.sold) {
      return right.sold - left.sold;
    }
    if (sortKey === 'gain' && left.gain !== right.gain) {
      return right.gain - left.gain;
    }
    if (sortKey === 'qty' && left.quantity !== right.quantity) {
      return right.quantity - left.quantity;
    }
    return byName(left, right);
  });
  return copy;
}

export function groupByBrand(rows: LoadSheetProductRow[], sortKey: LoadSheetSortKey): LoadSheetBrandGroup[] {
  const groups = new Map<string, LoadSheetProductRow[]>();
  rows.forEach(row => {
    const current = groups.get(row.brand) ?? [];
    current.push(row);
    groups.set(row.brand, current);
  });
  const brands = [...groups].map(([name, products]) => {
    const sorted = sortProductRows(products, sortKey);
    const totals = loadSheetTotals(sorted);
    return { name, ...totals, products: sorted };
  });
  brands.sort((left, right) => {
    if (sortKey === 'sold' && left.sold !== right.sold) {
      return right.sold - left.sold;
    }
    if (sortKey === 'gain' && left.gain !== right.gain) {
      return right.gain - left.gain;
    }
    if (sortKey === 'qty' && left.quantity !== right.quantity) {
      return right.quantity - left.quantity;
    }
    return left.name.localeCompare(right.name, 'es');
  });
  return brands;
}
