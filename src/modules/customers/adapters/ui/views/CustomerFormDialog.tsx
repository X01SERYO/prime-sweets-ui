import { X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { CreateCustomerUseCase } from '@/modules/customers/application/use-cases/createCustomer.useCase';
import type { UpdateCustomerUseCase } from '@/modules/customers/application/use-cases/updateCustomer.useCase';
import { customerErrorKey } from '@/modules/customers/adapters/ui/hooks/customerErrorKey';
import type { CustomerModel } from '@/modules/customers/domain/models/customer';
import { useLocale } from '@/shared/i18n/useLocale';
import type { MessageKey } from '@/shared/i18n/messages';
import { StatusMessage } from '@/shared/ui/StatusMessage';

const documentTypes = ['CC', 'NIT', 'CE', 'PA', 'TI'] as const;

interface CustomerFormDialogProps {
  customer?: CustomerModel | null;
  createCustomer?: CreateCustomerUseCase;
  updateCustomer?: UpdateCustomerUseCase;
  onClose: () => void;
  onSaved: (customer: CustomerModel) => void;
}

export function CustomerFormDialog({ customer, createCustomer, updateCustomer, onClose, onSaved }: CustomerFormDialogProps) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editing = Boolean(customer);
  const [documentType, setDocumentType] = useState(customer?.documentType || 'CC');
  const [documentNumber, setDocumentNumber] = useState(customer?.documentNumber ?? '');
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!documentType.trim() || !documentNumber.trim() || !name.trim()) {
      setError('customerFieldsRequired');
      return;
    }
    setSaving(true);
    setError(null);
    const input = { documentType, documentNumber, name, phone, email, address };
    try {
      const saved = editing && customer && updateCustomer
        ? await updateCustomer.execute(customer.id, input)
        : await createCustomer?.execute(input);
      if (saved) {
        onSaved(saved);
      }
    } catch (caught) {
      setError(customerErrorKey(caught, editing ? 'customerUpdateFailed' : 'customerCreateFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal customer-form-modal"
      onCancel={event => {
        event.preventDefault();
        if (!saving) {
          onClose();
        }
      }}
    >
      <form className="customer-form" onSubmit={event => void onSubmit(event)}>
        <div className="modal-toolbar">
          <h2>{editing ? t('customerEdit') : t('customerCreate')}</h2>
          <button className="modal-x" type="button" aria-label={t('close')} disabled={saving} onClick={onClose}>
            <X aria-hidden="true" strokeWidth={1.8} />
          </button>
        </div>
        <div className="customer-form-row">
          <label htmlFor="sale-document-type">
            {t('documentType')}
            <select id="sale-document-type" value={documentType} disabled={saving} onChange={event => setDocumentType(event.target.value)}>
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label htmlFor="sale-document-number">
            {t('documentNumber')}
            <input id="sale-document-number" value={documentNumber} disabled={saving} autoComplete="off" onChange={event => setDocumentNumber(event.target.value)} />
          </label>
        </div>
        <label htmlFor="sale-customer-name">{t('customerName')}</label>
        <input id="sale-customer-name" value={name} disabled={saving} autoComplete="name" onChange={event => setName(event.target.value)} />
        <details className="customer-bill" open={Boolean(email || phone || address)}>
          <summary>{t('extraInvoicing')}</summary>
          <label htmlFor="sale-customer-email">{t('email')}</label>
          <input id="sale-customer-email" type="email" value={email} disabled={saving} autoComplete="email" onChange={event => setEmail(event.target.value)} />
          <label htmlFor="sale-customer-phone">{t('phone')}</label>
          <input id="sale-customer-phone" value={phone} disabled={saving} autoComplete="tel" onChange={event => setPhone(event.target.value)} />
          <label htmlFor="sale-customer-address">{t('address')}</label>
          <input id="sale-customer-address" value={address} disabled={saving} onChange={event => setAddress(event.target.value)} />
        </details>
        {error ? <StatusMessage tone="error">{t(error)}</StatusMessage> : null}
        <div className="pending-actions">
          <button className="btn btn-secondary" type="button" disabled={saving} onClick={onClose}>{t('cancelLine')}</button>
          <button className="btn" type="submit" disabled={saving}>{editing ? t('customerSaveChanges') : t('customerSaveUse')}</button>
        </div>
      </form>
    </dialog>
  );
}
