export type InvoiceStatus = 'CONFIRMED' | 'VOIDED';

export interface InvoiceSummaryModel {
  saleId: string;
  deliveryDate: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  totalAmount: number;
}

export interface InvoiceLineModel {
  productId: string;
  productName: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface InvoiceDocumentModel {
  companyName: string;
  companyNit: string;
  city: string;
  country: string;
  telephone: string;
  logo: string;
  taxRegime: string;
  legalText: string;
  customerDocumentType: string;
  customerDocumentNumber: string;
  customerName: string;
  invoiceNumber: string;
  saleDate: string;
  deliveryDate: string;
  voided: boolean;
  lines: InvoiceLineModel[];
  subtotal: number;
  total: number;
}
