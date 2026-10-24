/**
 * Temporary list data copied from the screen mocks.
 * Delete this file when customers, day sales, the load sheet, and invoices read the API.
 */

export const dummyCustomers = [
  { id: 'c1', name: 'Tienda Doña Rosa', document: 'CC 52123456' },
  { id: 'c2', name: 'Minimercado El Vecino', document: 'NIT 900123456' },
  { id: 'c3', name: 'Supertienda La 80', document: 'CC 43890123' }
];

export const dummyDaySales = [
  { id: 's1', customer: 'Tienda Doña Rosa', status: 'DRAFT' as const, quantity: 10, total: 148500, invoiceNumber: null },
  { id: 's2', customer: 'Minimercado El Vecino', status: 'CONFIRMED' as const, quantity: 24, total: 312000, invoiceNumber: '001' },
  { id: 's3', customer: 'Supertienda La 80', status: 'VOIDED' as const, quantity: 6, total: 90000, invoiceNumber: '002' }
];

export const dummyLoadSheet = [
  { id: 'p1', brand: 'Colombina', name: 'Bon Bon Bum Fresa x24', cost: 14200, price: 18500, quantity: 27, total: 499500, profit: 116100 },
  { id: 'p2', brand: 'Jet', name: 'Chocolatina Jet x24', cost: 17500, price: 22000, quantity: 12, total: 264000, profit: 54000 },
  { id: 'p3', brand: 'Colombina', name: 'Gomitas Trululú x12', cost: 7600, price: 9800, quantity: 15, total: 147000, profit: 33000 },
  { id: 'p4', brand: 'Ramo', name: 'De Todito Natural x12', cost: null, price: 6400, quantity: 8, total: 51200, profit: null }
];

export const dummyInvoices = [
  { id: 'i1', number: '001', customer: 'Minimercado El Vecino', total: 312000, status: 'CONFIRMED' as const },
  { id: 'i2', number: '003', customer: 'Tienda Doña Rosa', total: 148500, status: 'CONFIRMED' as const },
  { id: 'i3', number: '002', customer: 'Supertienda La 80', total: 90000, status: 'VOIDED' as const }
];
