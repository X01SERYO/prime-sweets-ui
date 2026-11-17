import { HttpProductSearch } from '@/modules/catalog/adapters/infrastructure/httpProductSearch';
import { HttpCustomerCommand } from '@/modules/customers/adapters/infrastructure/httpCustomerCommand';
import { HttpCustomerQuery } from '@/modules/customers/adapters/infrastructure/httpCustomerQuery';
import { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/createCustomer.useCase';
import { GetCustomerUseCase } from '@/modules/customers/application/use-cases/getCustomer.useCase';
import { SearchCustomersUseCase } from '@/modules/customers/application/use-cases/searchCustomers.useCase';
import { HttpCatalogProduct } from '@/modules/catalog/adapters/infrastructure/httpCatalogProduct';
import { SearchCatalogProductsUseCase } from '@/modules/catalog/application/use-cases/searchCatalogProducts.useCase';
import { SearchProductsUseCase } from '@/modules/catalog/application/use-cases/searchProducts.useCase';
import { HttpBrand } from '@/modules/catalog/adapters/infrastructure/httpBrand';
import { CreateBrandUseCase } from '@/modules/catalog/application/use-cases/createBrand.useCase';
import { CreateCatalogProductUseCase } from '@/modules/catalog/application/use-cases/createCatalogProduct.useCase';
import { ListBrandsUseCase } from '@/modules/catalog/application/use-cases/listBrands.useCase';
import { UpdateCatalogProductUseCase } from '@/modules/catalog/application/use-cases/updateCatalogProduct.useCase';
import { BrowserSessionStore } from '@/modules/identity/adapters/infrastructure/browserSessionStore';
import { HttpAuth } from '@/modules/identity/adapters/infrastructure/httpAuth';
import { LoginUseCase } from '@/modules/identity/application/use-cases/login.useCase';
import { LogoutUseCase } from '@/modules/identity/application/use-cases/logout.useCase';
import type { SessionStorePort } from '@/modules/identity/application/ports/sessionStore.port';
import { HttpSale } from '@/modules/sales/adapters/infrastructure/httpSale';
import { AddSaleItemUseCase } from '@/modules/sales/application/use-cases/addSaleItem.useCase';
import { ConfirmSaleUseCase } from '@/modules/sales/application/use-cases/confirmSale.useCase';
import { CreateDraftSaleUseCase } from '@/modules/sales/application/use-cases/createDraftSale.useCase';
import { SetSaleDeliveryDateUseCase } from '@/modules/sales/application/use-cases/setSaleDeliveryDate.useCase';
import { GetSaleUseCase } from '@/modules/sales/application/use-cases/getSale.useCase';
import { ListSalesByDeliveryDateUseCase } from '@/modules/sales/application/use-cases/listSalesByDeliveryDate.useCase';
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
import { HttpRetailDay } from '@/modules/retail-sales/adapters/infrastructure/httpRetailDay';
import { HttpRetailProductSearch } from '@/modules/retail-sales/adapters/infrastructure/httpRetailProductSearch';
import { AddRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/addRetailItem.useCase';
import { GetTodayRetailDayUseCase } from '@/modules/retail-sales/application/use-cases/getTodayRetailDay.useCase';
import { ListRetailDaysUseCase } from '@/modules/retail-sales/application/use-cases/listRetailDays.useCase';
import { RemoveRetailItemUseCase } from '@/modules/retail-sales/application/use-cases/removeRetailItem.useCase';
import { ReviewRetailDaysUseCase } from '@/modules/retail-sales/application/use-cases/reviewRetailDays.useCase';
import { SearchRetailProductsUseCase } from '@/modules/retail-sales/application/use-cases/searchRetailProducts.useCase';
import { SetRetailItemQuantityUseCase } from '@/modules/retail-sales/application/use-cases/setRetailItemQuantity.useCase';
import { HttpPurchasing } from '@/modules/purchasing/adapters/infrastructure/httpPurchasing';
import {
  CreatePurchaseOrderUseCase,
  CreateSupplierUseCase,
  GetPurchaseOrderUseCase,
  GetSupplierUseCase,
  ListPurchaseOrdersUseCase,
  ListSuppliersUseCase,
  RenameSupplierUseCase,
  SetSupplierProductsUseCase,
  UpdatePurchaseOrderUseCase
} from '@/modules/purchasing/application/use-cases/purchasing.useCases';
import { env } from '@/shared/config/env';
import { createHttpClient, type HttpClient } from '@/shared/infrastructure/http/httpClient';

export interface AppContainer {
  http: HttpClient;
  apiBaseUrl: string;
  sessionStore: SessionStorePort;
  login: LoginUseCase;
  logout: LogoutUseCase;
  searchProducts: SearchProductsUseCase;
  searchCatalogProducts: SearchCatalogProductsUseCase;
  updateCatalogProduct: UpdateCatalogProductUseCase;
  createCatalogProduct: CreateCatalogProductUseCase;
  listBrands: ListBrandsUseCase;
  createBrand: CreateBrandUseCase;
  searchCustomers: SearchCustomersUseCase;
  getCustomer: GetCustomerUseCase;
  createCustomer: CreateCustomerUseCase;
  listDraftSales: ListDraftSalesUseCase;
  getSale: GetSaleUseCase;
  listDeliverySales: ListSalesByDeliveryDateUseCase;
  createDraftSale: CreateDraftSaleUseCase;
  setSaleDeliveryDate: SetSaleDeliveryDateUseCase;
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
  getTodayRetailDay: GetTodayRetailDayUseCase;
  searchRetailProducts: SearchRetailProductsUseCase;
  addRetailItem: AddRetailItemUseCase;
  setRetailItemQuantity: SetRetailItemQuantityUseCase;
  removeRetailItem: RemoveRetailItemUseCase;
  listRetailDays: ListRetailDaysUseCase;
  reviewRetailDays: ReviewRetailDaysUseCase;
  listSuppliers: ListSuppliersUseCase;
  createSupplier: CreateSupplierUseCase;
  renameSupplier: RenameSupplierUseCase;
  getSupplier: GetSupplierUseCase;
  setSupplierProducts: SetSupplierProductsUseCase;
  createPurchaseOrder: CreatePurchaseOrderUseCase;
  updatePurchaseOrder: UpdatePurchaseOrderUseCase;
  listPurchaseOrders: ListPurchaseOrdersUseCase;
  getPurchaseOrder: GetPurchaseOrderUseCase;
}

export function createAppContainer(): AppContainer {
  const sessionStore = new BrowserSessionStore();
  const http = createHttpClient(
    env.apiBaseUrl,
    () => sessionStore.read()?.token ?? null,
    () => sessionStore.clear()
  );
  const auth = new HttpAuth(http);
  const purchasing = new HttpPurchasing(http);
  return {
    apiBaseUrl: env.apiBaseUrl,
    http,
    sessionStore,
    login: new LoginUseCase(auth, sessionStore),
    logout: new LogoutUseCase(auth, sessionStore),
    searchProducts: new SearchProductsUseCase(new HttpProductSearch(http)),
    searchCatalogProducts: new SearchCatalogProductsUseCase(new HttpCatalogProduct(http)),
    updateCatalogProduct: new UpdateCatalogProductUseCase(new HttpCatalogProduct(http)),
    createCatalogProduct: new CreateCatalogProductUseCase(new HttpCatalogProduct(http)),
    listBrands: new ListBrandsUseCase(new HttpBrand(http)),
    createBrand: new CreateBrandUseCase(new HttpBrand(http)),
    searchCustomers: new SearchCustomersUseCase(new HttpCustomerQuery(http)),
    getCustomer: new GetCustomerUseCase(new HttpCustomerQuery(http)),
    createCustomer: new CreateCustomerUseCase(new HttpCustomerCommand(http)),
    listDraftSales: new ListDraftSalesUseCase(new HttpSale(http)),
    getSale: new GetSaleUseCase(new HttpSale(http)),
    listDeliverySales: new ListSalesByDeliveryDateUseCase(new HttpSale(http), new HttpCustomerQuery(http)),
    createDraftSale: new CreateDraftSaleUseCase(new HttpSale(http)),
    setSaleDeliveryDate: new SetSaleDeliveryDateUseCase(new HttpSale(http)),
    addSaleItem: new AddSaleItemUseCase(new HttpSale(http)),
    updateSaleItemQuantity: new UpdateSaleItemQuantityUseCase(new HttpSale(http)),
    updateSaleItemName: new UpdateSaleItemNameUseCase(new HttpSale(http)),
    removeSaleItem: new RemoveSaleItemUseCase(new HttpSale(http)),
    confirmSale: new ConfirmSaleUseCase(new HttpSale(http)),
    voidSale: new VoidSaleUseCase(new HttpSale(http)),
    listLoadSheet: new ListLoadSheetUseCase(new HttpLoadSheetQuery(http)),
    listInvoices: new ListInvoicesUseCase(new HttpInvoiceQuery(http)),
    generateInvoice: new GenerateInvoiceUseCase(new HttpInvoiceQuery(http)),
    printInvoices: new PrintInvoicesUseCase(new GenerateInvoiceUseCase(new HttpInvoiceQuery(http)), new BrowserInvoicePrint()),
    getTodayRetailDay: new GetTodayRetailDayUseCase(new HttpRetailDay(http)),
    searchRetailProducts: new SearchRetailProductsUseCase(new HttpRetailProductSearch(http)),
    addRetailItem: new AddRetailItemUseCase(new HttpRetailDay(http)),
    setRetailItemQuantity: new SetRetailItemQuantityUseCase(new HttpRetailDay(http)),
    removeRetailItem: new RemoveRetailItemUseCase(new HttpRetailDay(http)),
    listRetailDays: new ListRetailDaysUseCase(new HttpRetailDay(http)),
    reviewRetailDays: new ReviewRetailDaysUseCase(new HttpRetailDay(http)),
    listSuppliers: new ListSuppliersUseCase(purchasing),
    createSupplier: new CreateSupplierUseCase(purchasing),
    renameSupplier: new RenameSupplierUseCase(purchasing),
    getSupplier: new GetSupplierUseCase(purchasing),
    setSupplierProducts: new SetSupplierProductsUseCase(purchasing),
    createPurchaseOrder: new CreatePurchaseOrderUseCase(purchasing),
    updatePurchaseOrder: new UpdatePurchaseOrderUseCase(purchasing),
    listPurchaseOrders: new ListPurchaseOrdersUseCase(purchasing),
    getPurchaseOrder: new GetPurchaseOrderUseCase(purchasing)
  };
}
