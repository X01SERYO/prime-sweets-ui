import { useState } from 'react';
import type { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/createCustomer.useCase';
import { customerErrorKey } from '@/modules/customers/adapters/ui/hooks/customerErrorKey';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';
import type { MessageKey } from '@/shared/i18n/messages';

export function useCreateCustomer(createCustomer: CreateCustomerUseCase) {
  const [documentType, setDocumentType] = useState('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  async function submit(): Promise<CustomerModel | null> {
    if (!documentType.trim() || !documentNumber.trim() || !name.trim()) {
      setError('customerFieldsRequired');
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      return await createCustomer.execute({
        documentType,
        documentNumber,
        name,
        phone,
        email,
        address
      });
    } catch (caught) {
      setError(customerErrorKey(caught, 'customerCreateFailed'));
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
    documentType,
    setDocumentType,
    documentNumber,
    setDocumentNumber,
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    address,
    setAddress,
    saving,
    error,
    submit
  };
}
