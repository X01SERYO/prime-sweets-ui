export interface CustomerModel {
  id: string;
  documentType: string;
  documentNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface NewCustomer {
  documentType: string;
  documentNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}
