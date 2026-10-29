import { toInvoiceDocument, toInvoiceSummaries } from '@/modules/fulfillment-output/adapters/infrastructure/invoiceMapper';
import type { InvoiceQueryPort } from '@/modules/fulfillment-output/application/ports/invoiceQuery.port';
import { CompanyProfileNotConfiguredError } from '@/modules/fulfillment-output/domain/errors/companyProfileNotConfigured.error';
import { InvoiceInvalidError } from '@/modules/fulfillment-output/domain/errors/invoiceInvalid.error';
import { InvoiceNotPrintableError } from '@/modules/fulfillment-output/domain/errors/invoiceNotPrintable.error';
import type { InvoiceDocumentModel, InvoiceSummaryModel } from '@/modules/fulfillment-output/domain/models/invoiceSummary';
import { HttpRequestError, type HttpClient } from '@/shared/infrastructure/http/httpClient';

interface Envelope {
  success?: unknown;
  data?: unknown;
}

function mapInvoiceError(error: unknown): never {
  if (
    error instanceof InvoiceInvalidError ||
    error instanceof InvoiceNotPrintableError ||
    error instanceof CompanyProfileNotConfiguredError
  ) {
    throw error;
  }
  if (error instanceof HttpRequestError && error.code === 'SALE_NOT_INVOICEABLE') {
    throw new InvoiceNotPrintableError();
  }
  if (error instanceof HttpRequestError && error.code === 'COMPANY_PROFILE_NOT_CONFIGURED') {
    throw new CompanyProfileNotConfiguredError();
  }
  throw error;
}

export class HttpInvoiceQuery implements InvoiceQueryPort {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async list(salesDayId: string): Promise<InvoiceSummaryModel[]> {
    const body = await this.http.get<Envelope>(`/invoices?salesDayId=${encodeURIComponent(salesDayId)}`);
    if (!body || body.success !== true) {
      throw new InvoiceInvalidError();
    }
    return toInvoiceSummaries(body.data);
  }

  async get(saleId: string): Promise<InvoiceDocumentModel> {
    try {
      const body = await this.http.get<Envelope>(`/invoices/${encodeURIComponent(saleId)}`);
      if (!body || body.success !== true) {
        throw new InvoiceInvalidError();
      }
      return toInvoiceDocument(body.data);
    } catch (error) {
      mapInvoiceError(error);
    }
  }
}
