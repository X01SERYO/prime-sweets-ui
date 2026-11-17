export function lineCost(unitCost: number, quantity: number): number {
  return Math.round(unitCost * quantity * 100) / 100;
}

export function orderTotal(rows: { unitCost: number; quantity: number }[]): number {
  return Math.round(rows.reduce((sum, row) => sum + lineCost(row.unitCost, row.quantity), 0) * 100) / 100;
}
