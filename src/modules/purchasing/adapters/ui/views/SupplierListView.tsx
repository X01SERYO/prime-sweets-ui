import { Check, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type {
  CreateSupplierUseCase,
  ListSuppliersUseCase,
  RenameSupplierUseCase
} from '@/modules/purchasing/application/use-cases/purchasing.useCases';
import { PurchaseInvalidError } from '@/modules/purchasing/domain/errors/purchaseInvalid.error';
import type { SupplierListItem } from '@/modules/purchasing/domain/models/supplier';
import { useLocale } from '@/shared/i18n/useLocale';
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
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSuppliers.execute().then(setItems).catch(caught => setError(messageOf(caught, t('purchaseFailed'))));
  }, [listSuppliers, t]);

  const visible = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return items.filter(item => {
      const haystack = normalize(item.name);
      return terms.every(term => haystack.includes(term));
    });
  }, [items, query]);

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

  const countLabel = visible.length === 1 ? t('supplierCountOne') : t('supplierCount').replace('{count}', String(visible.length));

  return (
    <section className="stack supplier-screen">
      <header className="supplier-heading">
        <div>
          <p className="supplier-eyebrow">{t('purchasesEyebrow')}</p>
          <h1>{t('suppliersTitle')}</h1>
          <p className="supplier-subtitle">{t('suppliersSubtitle')}</p>
        </div>
        <button className="btn supplier-new" type="button" onClick={() => setCreating(open => !open)}>
          <Plus aria-hidden="true" strokeWidth={2.4} />
          {t('newSupplier')}
        </button>
      </header>
      {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
      {creating ? (
        <form className="supplier-create-panel" onSubmit={event => void onCreate(event)}>
          <div className="supplier-create">
            <label className="supplier-field" htmlFor="supplier-name">
              {t('supplierName')}
              <input
                id="supplier-name"
                value={name}
                placeholder={t('supplierNamePlaceholder')}
                maxLength={70}
                autoFocus
                onChange={event => setName(event.target.value.toLocaleUpperCase('es-CO'))}
                required
              />
            </label>
            <div className="supplier-form-actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setCreating(false);
                  setName('');
                }}
              >
                {t('cancelAction')}
              </button>
              <button className="btn" type="submit">
                <Plus aria-hidden="true" strokeWidth={2.4} />
                {t('createSupplier')}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="supplier-toolbar">
        <label className="supplier-search">
          <Search aria-hidden="true" strokeWidth={2.2} />
          <input
            type="search"
            value={query}
            placeholder={t('searchSuppliers')}
            aria-label={t('searchSuppliers')}
            autoComplete="off"
            onChange={event => setQuery(event.target.value)}
          />
        </label>
        <span className="supplier-count">{countLabel}</span>
      </div>

      <div className="supplier-section-head">
        <h2>{t('allSuppliers')}</h2>
        <small>{t('supplierActionHint')}</small>
      </div>

      {items.length === 0 ? <StatusMessage tone="info">{t('noSuppliers')}</StatusMessage> : null}
      {items.length > 0 && visible.length === 0 ? <p className="supplier-empty">{t('suppliersNoMatch')}</p> : null}
      <ul className="supplier-list">
        {visible.map(item => {
          const editing = editingId === item.id;
          return (
            <li key={item.id} className="supplier-row">
              <span className="supplier-main">
                <span className="supplier-avatar" aria-hidden="true">
                  {initials(item.name)}
                </span>
                <span className="supplier-identity">
                  <span className="supplier-name-line">
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
                    <button
                      className="supplier-rename"
                      type="button"
                      aria-label={editing ? t('saveSupplier') : t('renameSupplier')}
                      onClick={() => {
                        if (editing) {
                          void onRename(item);
                          return;
                        }
                        setDraft(item.name);
                        setEditingId(item.id);
                      }}
                    >
                      {editing ? <Check aria-hidden="true" strokeWidth={1.8} /> : <Pencil aria-hidden="true" strokeWidth={1.8} />}
                    </button>
                  </span>
                  <span className="supplier-meta">{t('supplierRegistered')}</span>
                </span>
              </span>
              <span className="supplier-row-actions">
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
                  <Plus aria-hidden="true" strokeWidth={2.4} />
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

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toLocaleUpperCase('es-CO');
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof PurchaseInvalidError ? error.code : fallback;
}
