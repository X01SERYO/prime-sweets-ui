import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';
import type { InvoiceDocumentModel, InvoiceLineModel, InvoiceStatus, InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

function money(value: unknown): number {
  const amount = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(amount)) {
    throw new InvoiceInvalidError();
  }
  return amount;
}

function text(value: unknown): string {
  if (typeof value !== 'string') {
    throw new InvoiceInvalidError();
  }
  return value;
}

export function toInvoiceSummaries(raw: unknown): InvoiceSummaryModel[] {
  if (!Array.isArray(raw)) {
    throw new InvoiceInvalidError();
  }
  return raw.map(item => {
    if (!item || typeof item !== 'object') {
      throw new InvoiceInvalidError();
    }
    const row = item as Record<string, unknown>;
    if (row.status !== 'CONFIRMED' && row.status !== 'VOIDED') {
      throw new InvoiceInvalidError();
    }
    const status: InvoiceStatus = row.status;
    return {
      saleId: text(row.saleId),
      salesDayId: text(row.salesDayId),
      customerId: text(row.customerId),
      invoiceNumber: text(row.invoiceNumber),
      status,
      totalAmount: money(row.totalAmount)
    };
  });
}

function toLine(raw: unknown): InvoiceLineModel {
  if (!raw || typeof raw !== 'object') {
    throw new InvoiceInvalidError();
  }
  const line = raw as Record<string, unknown>;
  if (typeof line.quantity !== 'number') {
    throw new InvoiceInvalidError();
  }
  return {
    productId: text(line.productId),
    productName: text(line.productName),
    quantity: line.quantity,
    unitValue: money(line.unitValue),
    totalValue: money(line.totalValue)
  };
}

export function toInvoiceDocument(raw: unknown): InvoiceDocumentModel {
  if (!raw || typeof raw !== 'object') {
    throw new InvoiceInvalidError();
  }
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.lines)) {
    throw new InvoiceInvalidError();
  }
  return {
    companyName: text(data.companyName),
    companyNit: text(data.companyNit),
    city: text(data.city),
    country: text(data.country),
    telephone: text(data.telephone),
    logo: text(data.logo),
    taxRegime: text(data.taxRegime),
    legalText: text(data.legalText),
    customerDocumentType: text(data.customerDocumentType),
    customerDocumentNumber: text(data.customerDocumentNumber),
    customerName: text(data.customerName),
    invoiceNumber: text(data.invoiceNumber),
    saleDate: text(data.saleDate),
    lines: data.lines.map(toLine),
    subtotal: money(data.subtotal),
    total: money(data.total)
  };
}
