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
import { OpenSalesDayUseCase } from '@/modules/sales-day/application/use-cases/openSalesDay.useCase';
import { HttpSale } from '@/modules/sales/adapters/infrastructure/httpSale';
import { AddSaleItemUseCase } from '@/modules/sales/application/use-cases/addSaleItem.useCase';
import { CreateDraftSaleUseCase } from '@/modules/sales/application/use-cases/createDraftSale.useCase';
import { ListDraftSalesUseCase } from '@/modules/sales/application/use-cases/listDraftSales.useCase';
import { RemoveSaleItemUseCase } from '@/modules/sales/application/use-cases/removeSaleItem.useCase';
import { UpdateSaleItemNameUseCase } from '@/modules/sales/application/use-cases/updateSaleItemName.useCase';
import { UpdateSaleItemQuantityUseCase } from '@/modules/sales/application/use-cases/updateSaleItemQuantity.useCase';
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
  openSalesDay: OpenSalesDayUseCase;
  searchCustomers: SearchCustomersUseCase;
  getCustomer: GetCustomerUseCase;
  createCustomer: CreateCustomerUseCase;
  listDraftSales: ListDraftSalesUseCase;
  createDraftSale: CreateDraftSaleUseCase;
  addSaleItem: AddSaleItemUseCase;
  updateSaleItemQuantity: UpdateSaleItemQuantityUseCase;
  updateSaleItemName: UpdateSaleItemNameUseCase;
  removeSaleItem: RemoveSaleItemUseCase;
}

export function createAppContainer(): AppContainer {
  const sessionStore = new BrowserSessionStore();
  const http = createHttpClient(env.apiBaseUrl, () => sessionStore.read()?.token ?? null);
  const auth = new HttpAuth(http);
  return {
    apiBaseUrl: env.apiBaseUrl,
    http,
    sessionStore,
    login: new LoginUseCase(auth, sessionStore),
    logout: new LogoutUseCase(auth, sessionStore),
    searchProducts: new SearchProductsUseCase(new HttpProductSearch(http)),
    getCurrentSalesDay: new GetCurrentSalesDayUseCase(new HttpSalesDayQuery(http)),
    openSalesDay: new OpenSalesDayUseCase(new HttpSalesDayCommand(http)),
    searchCustomers: new SearchCustomersUseCase(new HttpCustomerQuery(http)),
    getCustomer: new GetCustomerUseCase(new HttpCustomerQuery(http)),
    createCustomer: new CreateCustomerUseCase(new HttpCustomerCommand(http)),
    listDraftSales: new ListDraftSalesUseCase(new HttpSale(http)),
    createDraftSale: new CreateDraftSaleUseCase(new HttpSale(http)),
    addSaleItem: new AddSaleItemUseCase(new HttpSale(http)),
    updateSaleItemQuantity: new UpdateSaleItemQuantityUseCase(new HttpSale(http)),
    updateSaleItemName: new UpdateSaleItemNameUseCase(new HttpSale(http)),
    removeSaleItem: new RemoveSaleItemUseCase(new HttpSale(http))
  };
}
