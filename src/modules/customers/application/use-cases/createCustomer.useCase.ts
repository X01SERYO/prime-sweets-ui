import type { CustomerCommandPort } from '@/modules/customers/application/ports/customerCommand.port';
import { CustomerInvalidError } from '@/modules/customers/domain/errors/customerInvalid.error';
import type { CustomerModel, NewCustomer } from '@/modules/customers/domain/models/customer';

function optionalText(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

export class CreateCustomerUseCase {
  private readonly command: CustomerCommandPort;

  constructor(command: CustomerCommandPort) {
    this.command = command;
  }

  async execute(input: NewCustomer): Promise<CustomerModel> {
    const documentType = input.documentType.trim();
    const documentNumber = input.documentNumber.trim();
    const name = input.name.trim();
    if (!documentType || !documentNumber || !name) {
      throw new CustomerInvalidError();
    }
    return this.command.create({
      documentType,
      documentNumber,
      name,
      phone: optionalText(input.phone),
      email: optionalText(input.email),
      address: optionalText(input.address)
    });
  }
}
