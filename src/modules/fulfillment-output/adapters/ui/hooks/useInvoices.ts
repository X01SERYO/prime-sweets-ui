import { useState } from 'react';
import type { ListInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/listInvoices.useCase';
import type { InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';

export function useInvoices(listInvoices: ListInvoicesUseCase): InvoiceSummaryModel[] {
  const [invoices] = useState(() => listInvoices.execute());
  return invoices;
}
