import { HttpProductSearch } from '@/modules/catalog/adapters/infrastructure/httpProductSearch';
import { HttpCustomerCommand } from '@/modules/customers/adapters/infrastructure/httpCustomerCommand';
import { HttpCustomerQuery } from '@/modules/customers/adapters/infrastructure/httpCustomerQuery';
import { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/createCustomer.useCase';
import { GetCustomerUseCase } from '@/modules/customers/application/use-cases/getCustomer.useCase';
import { SearchCustomersUseCase } from '@/modules/customers/application/use-cases/searchCustomers.useCase';
import { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import { BrowserSessionStore } from '@/modules/identity/adapters/infrastructure/browserSessionStore';
import { HttpAuth } from '@/modules/identity/adapters/infrastructure/httpAuth';
import { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import { LogoutUseCase } from '@/modules/identity/application/use-cases/logout.useCase';
import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';
import { HttpSalesDayCommand } from '@/modules/sales-day/adapters/infrastructure/httpSalesDayCommand';
import { HttpSalesDayQuery } from '@/modules/sales-day/adapters/infrastructure/httpSalesDayQuery';
import { GetCurrentSalesDayUseCase } from '@/modules/sales-day/application/use-cases/getCurrentSalesDay.useCase';
import { ListRecentSalesDaysUseCase } from '@/modules/sales-day/application/use-cases/listRecentSalesDays.useCase';
import { OpenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/openSalesDay.useCase';
import { CloseSalesDayUseCase } from '@/modules/sales-day/application/use-cases/closeSalesDay.useCase';
import { ReopenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/reopenSalesDay.useCase';
import { HttpSale } from '@/modules/sales/adapters/infrastructure/httpSale';
import { AddSaleItemUseCase } from '@/modules/sales/application/use-cases/addSaleItem.useCase';
import { ConfirmSaleUseCase } from '@/modules/sales/application/use-cases/confirmSale.useCase';
import { CreateDraftSaleUseCase } from '@/modules/sales/application/use-cases/createDraftSale.useCase';
import { GetSaleUseCase } from '@/modules/sales/application/use-cases/getSale.useCase';
import { ListDaySalesUseCase } from '@/modules/sales/application/use-cases/listDaySales.useCase';
import { ListDraftSalesUseCase } from '@/modules/sales/application/use-cases/listDraftSales.useCase';
import { RemoveSaleItemUseCase } from '@/modules/sales/application/use-cases/removeSaleItem.useCase';
import { UpdateSaleItemNameUseCase } from '@/modules/sales/application/use-cases/updateSaleItemName.useCase';
import { UpdateSaleItemQuantityUseCase } from '@/modules/sales/application/use-cases/updateSaleItemQuantity.useCase';
import { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import { BrowserInvoicePrint } from '@/modules/fulfillment-output/adapters/infrastructure/browserInvoicePrint';
import { HttpInvoiceQuery } from '@/modules/fulfillment-output/adapters/infrastructure/httpInvoiceQuery';
import { HttpLoadSheetQuery } from '@/modules/fulfillment-output/adapters/infrastructure/httpLoadSheetQuery';
import { GenerateInvoiceUseCase } from '@/modules/fulfillment-output/application/use-cases/generateInvoice.useCase';
import { ListInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/listInvoices.useCase';
import { ListLoadSheetUseCase } from '@/modules/fulfillment-output/application/use-cases/listLoadSheet.useCase';
import { PrintInvoicesUseCase } from '@/modules/fulfillment-output/application/use-cases/printInvoices.useCase';
import { env } from '@/shared/config/env';
import { createHttpClient, type HttpClient } from '@/shared/infrastructure/http/httpClient';

export interface AppContainer {
  http: HttpClient;
  apiBaseUrl: string;
  sessionStore: SessionStorePort;
  login: LoginUseCase;
  logout: LogoutUseCase;
  searchProducts: SearchProductsUseCase;
  getCurrentSalesDay: GetCurrentSalesDayUseCase;
  listRecentSalesDays: ListRecentSalesDaysUseCase;
  openSalesDay: OpenSalesDayUseCase;
  closeSalesDay: CloseSalesDayUseCase;
  reopenSalesDay: ReopenSalesDayUseCase;
  searchCustomers: SearchCustomersUseCase;
  getCustomer: GetCustomerUseCase;
  createCustomer: CreateCustomerUseCase;
  listDraftSales: ListDraftSalesUseCase;
  getSale: GetSaleUseCase;
  listDaySales: ListDaySalesUseCase;
  createDraftSale: CreateDraftSaleUseCase;
  addSaleItem: AddSaleItemUseCase;
  updateSaleItemQuantity: UpdateSaleItemQuantityUseCase;
  updateSaleItemName: UpdateSaleItemNameUseCase;
  removeSaleItem: RemoveSaleItemUseCase;
  confirmSale: ConfirmSaleUseCase;
  voidSale: VoidSaleUseCase;
  listLoadSheet: ListLoadSheetUseCase;
  listInvoices: ListInvoicesUseCase;
  generateInvoice: GenerateInvoiceUseCase;
  printInvoices: PrintInvoicesUseCase;
}

export function createAppContainer(): AppContainer {
  const sessionStore = new BrowserSessionStore();
  const http = createHttpClient(env.apiBaseUrl, () => sessionStore.read()?.token ?? null);
  const auth = new HttpAuth(http);
  const salesDayQuery = new HttpSalesDayQuery(http);
  return {
    apiBaseUrl: env.apiBaseUrl,
    http,
    sessionStore,
    login: new LoginUseCase(auth, sessionStore),
    logout: new LogoutUseCase(auth, sessionStore),
    searchProducts: new SearchProductsUseCase(new HttpProductSearch(http)),
    getCurrentSalesDay: new GetCurrentSalesDayUseCase(salesDayQuery),
    listRecentSalesDays: new ListRecentSalesDaysUseCase(salesDayQuery),
    openSalesDay: new OpenSalesDayUseCase(new HttpSalesDayCommand(http)),
    closeSalesDay: new CloseSalesDayUseCase(new HttpSalesDayCommand(http)),
    reopenSalesDay: new ReopenSalesDayUseCase(new HttpSalesDayCommand(http)),
    searchCustomers: new SearchCustomersUseCase(new HttpCustomerQuery(http)),
    getCustomer: new GetCustomerUseCase(new HttpCustomerQuery(http)),
    createCustomer: new CreateCustomerUseCase(new HttpCustomerCommand(http)),
    listDraftSales: new ListDraftSalesUseCase(new HttpSale(http)),
    getSale: new GetSaleUseCase(new HttpSale(http)),
    listDaySales: new ListDaySalesUseCase(new HttpSale(http), new HttpCustomerQuery(http)),
    createDraftSale: new CreateDraftSaleUseCase(new HttpSale(http)),
    addSaleItem: new AddSaleItemUseCase(new HttpSale(http)),
    updateSaleItemQuantity: new UpdateSaleItemQuantityUseCase(new HttpSale(http)),
    updateSaleItemName: new UpdateSaleItemNameUseCase(new HttpSale(http)),
    removeSaleItem: new RemoveSaleItemUseCase(new HttpSale(http)),
    confirmSale: new ConfirmSaleUseCase(new HttpSale(http)),
    voidSale: new VoidSaleUseCase(new HttpSale(http)),
    listLoadSheet: new ListLoadSheetUseCase(new HttpLoadSheetQuery(http)),
    listInvoices: new ListInvoicesUseCase(new HttpInvoiceQuery(http)),
    generateInvoice: new GenerateInvoiceUseCase(new HttpInvoiceQuery(http)),
    printInvoices: new PrintInvoicesUseCase(new GenerateInvoiceUseCase(new HttpInvoiceQuery(http)), new BrowserInvoicePrint())
  };
}
