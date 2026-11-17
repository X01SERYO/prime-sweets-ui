import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  RenameSupplierUseCase
} from '@/modules/purchasing/application/use-cases/purchasing.useCases';
import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import type { SupplierListItem } from '@/modules/purchasing/domain/models/supplier';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { StatusMessage } from '@/shared/ui/StatusMessage';
import './purchaseSheet.css';

interface SupplierListViewProps {
  listSuppliers: ListSuppliersUseCase;
  createSupplier: CreateSupplierUseCase;
  renameSupplier: RenameSupplierUseCase;
}

export function SupplierListView({ listSuppliers, createSupplier, renameSupplier }: SupplierListViewProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [items, setItems] = useState<SupplierListItem[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSuppliers.execute().then(setItems).catch(caught => setError(messageOf(caught, t('purchaseFailed'))));
  }, [listSuppliers, t]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const created = await createSupplier.execute(name);
      navigate(`/purchasing/${created.id}`);
    } catch (caught) {
      setError(messageOf(caught, t('purchaseFailed')));
    }
  }

  async function onRename(item: SupplierListItem) {
    const next = draft.trim().toLocaleUpperCase('es-CO');
    if (!next || next === item.name) {
      setEditingId(null);
      return;
    }
    setError(null);
    try {
      await renameSupplier.execute(item.id, next);
      setItems(current => current.map(row => (row.id === item.id ? { ...row, name: next } : row)));
      setEditingId(null);
    } catch (caught) {
      setError(messageOf(caught, t('purchaseFailed')));
    }
  }

  return (
    <section className="stack">
      <ScreenTitle>{t('suppliersTitle')}</ScreenTitle>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      <form className="card" onSubmit={event => void onCreate(event)}>
        <label htmlFor="supplier-name">{t('supplierName')}</label>
        <div className="search-row">
          <input id="supplier-name" value={name} onChange={event => setName(event.target.value.toLocaleUpperCase('es-CO'))} required />
          <button className="btn" type="submit">
            {t('createSupplier')}
          </button>
        </div>
      </form>
      {items.length === 0 ? <StatusMessage tone="info">{t('noSuppliers')}</StatusMessage> : null}
      <ul className="supplier-list">
        {items.map(item => {
          const editing = editingId === item.id;
          return (
            <li key={item.id} className="supplier-row">
              {editing ? (
                <input
                  className="supplier-row-input"
                  aria-label={t('supplierName')}
                  value={draft}
                  autoFocus
                  onChange={event => setDraft(event.target.value.toLocaleUpperCase('es-CO'))}
                  onKeyDown={event => {
                    if (event.key === 'Escape') setEditingId(null);
                    if (event.key === 'Enter') void onRename(item);
                  }}
                />
              ) : (
                <span className="supplier-row-name">{item.name}</span>
              )}
              <span className="supplier-row-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    if (editing) {
                      void onRename(item);
                      return;
                    }
                    setDraft(item.name);
                    setEditingId(item.id);
                  }}
                >
                  {t('renameSupplier')}
                </button>
                {item.latestOrderId ? (
                  <Link className="btn btn-secondary" to={`/purchasing/${item.id}?order=${item.latestOrderId}`}>
                    {t('editLastOrder')}
                  </Link>
                ) : (
                  <button className="btn btn-secondary" type="button" disabled>
                    {t('editLastOrder')}
                  </button>
                )}
                <Link className="btn" to={`/purchasing/${item.id}`}>
                  {t('newPurchaseOrder')}
                </Link>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof PurchaseInvalidError ? error.code : fallback;
}
