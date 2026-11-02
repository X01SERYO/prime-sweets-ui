import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { SearchCatalogProductsUseCase } from '@/modules/catalog/application/use-cases/searchCatalogProducts.useCase';
import type { UpdateCatalogProductUseCase } from '@/modules/catalog/application/use-cases/updateCatalogProduct.useCase';
import type { CatalogProduct, CatalogProductPatch } from '@/modules/catalog/domain/models/catalogProduct';
import { realMarginPercent, suggestedSalePrice } from '@/modules/catalog/domain/productPricing';
import { isProductSearchTerm } from '@/modules/catalog/domain/productSearchTerm';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { HttpRequestError } from '@/shared/infrastructure/http/httpClient';
import './productAdmin.css';

interface ProductAdminProps {
  searchCatalogProducts: SearchCatalogProductsUseCase;
  updateCatalogProduct: UpdateCatalogProductUseCase;
}

type Draft = {
  name: string;
  margin: string;
  wholesaleCost: string;
  wholesalePrice: string;
  retailCost: string;
  retailPrice: string;
  units: string;
  pack: string;
};

const fields = ['wholesaleCost', 'wholesalePrice', 'retailPrice', 'units', 'pack'] as const;
const PAGE_SIZES = [10, 20, 30, 40, 50];

function draftFrom(product: CatalogProduct): Draft {
  return {
    name: product.name ?? '',
    margin: '15',
    wholesaleCost: text(product.wholesaleCost),
    wholesalePrice: text(product.wholesalePrice),
    retailCost: text(product.retailCost),
    retailPrice: text(product.retailPrice),
    units: String(product.units),
    pack: String(product.pack)
  };
}

function text(value: number | null): string {
  return value === null ? '' : String(value);
}

function parseMoney(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return amount;
}

function changedMoney(draft: string, current: number | null): number | undefined | 'invalid' {
  if (draft.trim() === '') {
    return current === null ? undefined : 'invalid';
  }
  const amount = Number(draft);
  if (!Number.isFinite(amount) || amount < 0) {
    return 'invalid';
  }
  return amount === current ? undefined : amount;
}

function changedCount(draft: string, current: number): number | undefined | 'invalid' {
  if (draft.trim() === '') {
    return 'invalid';
  }
  const amount = Number(draft);
  if (!Number.isInteger(amount) || amount < 0) {
    return 'invalid';
  }
  return amount === current ? undefined : amount;
}

function retailUnitCost(wholesaleCost: number | null, units: number): number {
  if (wholesaleCost === null || !Number.isFinite(wholesaleCost) || !Number.isFinite(units) || units <= 0) {
    return 0;
  }
  return Math.round(wholesaleCost / units);
}

function patchFor(product: CatalogProduct, draft: Draft): CatalogProductPatch | 'invalid' | null {
  const next = {
    wholesaleCost: changedMoney(draft.wholesaleCost, product.wholesaleCost),
    wholesalePrice: changedMoney(draft.wholesalePrice, product.wholesalePrice),
    retailPrice: changedMoney(draft.retailPrice, product.retailPrice),
    units: changedCount(draft.units, product.units),
    pack: changedCount(draft.pack, product.pack)
  };
  if (Object.values(next).some(value => value === 'invalid')) {
    return 'invalid';
  }
  const name = draft.name.trim();
  if (name === '') {
    return 'invalid';
  }
  const wholesaleCost = next.wholesaleCost === undefined ? product.wholesaleCost : next.wholesaleCost;
  const units = next.units === undefined ? product.units : next.units;
  const retailCost = retailUnitCost(wholesaleCost, units);
  if (retailCost <= 0) {
    return 'invalid';
  }
  const patch: CatalogProductPatch = {};
  if (name !== (product.name ?? '')) {
    patch.name = name;
  }
  for (const field of fields) {
    const value = next[field];
    if (typeof value === 'number') {
      patch[field] = value;
    }
  }
  if (retailCost !== product.retailCost) {
    patch.retailCost = retailCost;
  }
  return Object.keys(patch).length === 0 ? null : patch;
}

export function ProductAdmin({ searchCatalogProducts, updateCatalogProduct }: ProductAdminProps) {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const createdName = (location.state as { createdName?: string } | null)?.createdName ?? '';
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const dismissToast = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  async function load(nextPage: number, term: string, size = pageSize) {
    const trimmed = term.trim();
    if (trimmed && !isProductSearchTerm(trimmed)) {
      setError(t('searchRequired'));
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const found = await searchCatalogProducts.execute(nextPage, size, trimmed || undefined);
      setPage(found.page);
      setTotal(found.total);
      setPageSize(found.pageSize);
      setProducts(found.items);
    } catch {
      setProducts([]);
      setError(t('catalogFailed'));
    }
  }

  useEffect(() => {
    void load(1, '').then(() => {
      if (!createdName) {
        return;
      }
      setNotice(t('productCreated').replace('{name}', createdName));
      navigate('/products', { replace: true, state: null });
    });
    // The first page loads once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEditor(product: CatalogProduct) {
    setEditing(product);
    setDraft(draftFrom(product));
    setError(null);
  }

  function changeDraft(field: keyof Draft, value: string) {
    setDraft(current => (current ? { ...current, [field]: value } : current));
  }

  async function save(product: CatalogProduct) {
    if (!draft) {
      return;
    }
    const patch = patchFor(product, draft);
    if (patch === 'invalid') {
      setError(t('productInvalid'));
      return;
    }
    if (!patch) {
      return;
    }
    setSavingId(product.id);
    setError(null);
    try {
      const saved = await updateCatalogProduct.execute(product.id, patch);
      setProducts(current => current.map(item => (item.id === saved.id ? saved : item)));
      setEditing(null);
      setDraft(null);
      setNotice(t('productSaved').replace('{name}', saved.name ?? saved.code));
    } catch (caught) {
      if (caught instanceof HttpRequestError && caught.code === 'ALEGRA_SYNC_FAILED') {
        setError(`${t('alegraSyncFailed')} ${caught.message}`);
      } else {
        setError(caught instanceof CatalogInvalidError || caught instanceof HttpRequestError ? t('productInvalid') : t('productUpdateFailed'));
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="stack">
      <div className="product-admin-heading">
        <ScreenTitle>{t('products')}</ScreenTitle>
        <Link className="btn" to="/products/new">
          {t('createProduct')}
        </Link>
      </div>
      <form
        onSubmit={event => {
          event.preventDefault();
          void load(1, query);
        }}
      >
        <div className="search-label">
          <label htmlFor="product-admin-query">{t('searchProduct')}</label>
          <button type="button" className="info-tip" aria-label={t('searchHint')}>
            <InfoIcon />
            <span className="info-tip-text" role="tooltip">
              {t('searchHint')}
            </span>
          </button>
        </div>
        <div className="search-row">
          <input
            className="search-field"
            id="product-admin-query"
            value={query}
            autoComplete="off"
            onChange={event => setQuery(event.target.value)}
          />
          <button
            className="btn search-submit"
            type="submit"
            aria-label={t('search')}
            disabled={query.trim().length > 0 && !isProductSearchTerm(query)}
          >
            <SearchIcon />
          </button>
        </div>
      </form>
      <table className="product-admin-table">
        <thead>
          <tr>
            <th>{t('code')}</th>
            <th>{t('productName')}</th>
            <th className="product-admin-wide">{t('productWholesaleCost')}</th>
            <th className="product-admin-wide">{t('wholesaleSale')}</th>
            <th className="product-admin-wide">{t('retailCost')}</th>
            <th className="product-admin-wide">{t('retailSale')}</th>
            <th className="product-admin-wide">{t('productUnits')}</th>
            <th className="product-admin-wide">{t('productPack')}</th>
            <th className="product-admin-wide">{t('brand')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>{product.code}</td>
              <td>{product.name ?? t('noName')}</td>
              <td className="product-admin-wide">{money(product.wholesaleCost, t('notAvailable'))}</td>
              <td className="product-admin-wide">{money(product.wholesalePrice, t('notAvailable'))}</td>
              <td className="product-admin-wide">{money(product.retailCost, t('notAvailable'))}</td>
              <td className="product-admin-wide">{money(product.retailPrice, t('notAvailable'))}</td>
              <td className="product-admin-wide">{product.units}</td>
              <td className="product-admin-wide">{product.pack}</td>
              <td className="product-admin-wide">{product.brandName ?? '—'}</td>
              <td>
                <button className="btn icon-btn icon-edit" type="button" aria-label={t('editProduct')} onClick={() => openEditor(product)}>
                  <EditIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && draft ? (
        <ProductEditor
          product={editing}
          draft={draft}
          saving={savingId === editing.id}
          error={error}
          onDismiss={dismissToast}
          onChange={changeDraft}
          onClose={() => {
            setEditing(null);
            setDraft(null);
          }}
          onSave={() => void save(editing)}
        />
      ) : null}
      <div className="product-admin-pager">
        <button className="btn btn-secondary" type="button" disabled={page <= 1} onClick={() => void load(page - 1, query)}>
          {t('previousPage')}
        </button>
        <span>
          {page} / {Math.max(1, Math.ceil(total / pageSize))}
        </span>
        <button className="btn btn-secondary" type="button" disabled={page * pageSize >= total} onClick={() => void load(page + 1, query)}>
          {t('nextPage')}
        </button>
        <label className="product-admin-size">
          <select aria-label={t('pageSize')}
            value={pageSize}
            onChange={event => {
              const size = Number(event.target.value);
              setPageSize(size);
              void load(1, query, size);
            }}
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!editing && (error || notice) ? <Toast error={error} notice={notice} onDone={dismissToast} /> : null}
    </section>
  );
}

function money(value: number | null, empty: string): string {
  return value === null ? empty : formatCurrency(value);
}

function percent(value: number | null, empty: string): string {
  return value === null ? empty : `${value}%`;
}

function Toast({
  error,
  notice,
  onDone
}: {
  error: string | null;
  notice: string | null;
  onDone: () => void;
}) {
  const message = error ?? notice;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!message) {
      return;
    }
    setLeaving(false);
    const visibleFor = Math.min(12000, 4000 + message.length * 45);
    const hide = window.setTimeout(() => setLeaving(true), visibleFor);
    const done = window.setTimeout(onDone, visibleFor + 380);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, [message, onDone]);

  const { t } = useLocale();
  if (!message) {
    return null;
  }
  return (
    <p
      className={`product-admin-toast ${error ? 'is-error' : 'is-ok'}${leaving ? ' is-leaving' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      <strong className="product-admin-toast-title">{error ? t('toastError') : t('toastOk')}: </strong>
      {message}
    </p>
  );
}

function ProductEditor({
  product,
  draft,
  saving,
  error,
  onDismiss,
  onChange,
  onClose,
  onSave
}: {
  product: CatalogProduct;
  draft: Draft;
  saving: boolean;
  error: string | null;
  onDismiss: () => void;
  onChange: (field: keyof Draft, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    titleRef.current?.focus();
  }, []);

  const suggested = suggestedSalePrice(parseMoney(draft.wholesaleCost), Number(draft.margin));
  const retailCost = retailUnitCost(parseMoney(draft.wholesaleCost), Number(draft.units));

  return (
    <dialog ref={dialogRef} className="product-editor" onCancel={onClose}>
      <h2 ref={titleRef} tabIndex={-1}>
        {t('editProduct')}
      </h2>
      <div className="product-editor-grid">
        <Field label={t('code')} value={product.code} locked />
        <Field label={t('brand')} value={product.brandName ?? '—'} locked />
        <Field label={t('productName')} wide>
          <input value={draft.name} onChange={event => onChange('name', event.target.value.toLocaleUpperCase('es-CO'))} />
        </Field>
        <Field label={t('marginPercent')}>
          <input value={draft.margin} inputMode="decimal" onChange={event => onChange('margin', event.target.value)} />
        </Field>
        <Field label={t('suggestedPrice')} value={money(suggested, t('notAvailable'))} locked />
        <div className="product-editor-line">
          <Field label={t('productWholesaleCost')}>
            <MoneyInput value={draft.wholesaleCost} onChange={value => onChange('wholesaleCost', value)} />
          </Field>
          <Field label={t('wholesaleSale')}>
            <MoneyInput value={draft.wholesalePrice} onChange={value => onChange('wholesalePrice', value)} />
          </Field>
          <Field
            label={t('wholesaleMargin')}
            value={percent(realMarginPercent(parseMoney(draft.wholesalePrice), parseMoney(draft.wholesaleCost)), t('notAvailable'))}
            locked
          />
        </div>
        <div className="product-editor-line">
          <Field label={t('retailCost')} value={money(retailCost, t('notAvailable'))} locked />
          <Field label={t('retailSale')}>
            <MoneyInput value={draft.retailPrice} onChange={value => onChange('retailPrice', value)} />
          </Field>
          <Field
            label={t('retailMargin')}
            value={percent(realMarginPercent(parseMoney(draft.retailPrice), retailCost) ?? 0, t('notAvailable'))}
            locked
          />
        </div>
        <Field label={t('productUnits')}>
          <input value={draft.units} inputMode="numeric" onChange={event => onChange('units', event.target.value)} />
        </Field>
        <Field label={t('productPack')}>
          <input value={draft.pack} inputMode="numeric" onChange={event => onChange('pack', event.target.value)} />
        </Field>
      </div>
      <div className="product-editor-actions">
        <button className="btn btn-secondary" type="button" onClick={onClose}>
          {t('cancelAction')}
        </button>
        <button className="btn" type="button" disabled={saving || retailCost <= 0} onClick={onSave}>
          {saving ? t('savingProduct') : t('saveProduct')}
        </button>
      </div>
      <Toast error={error} notice={null} onDone={onDismiss} />
    </dialog>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.25" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 7.25v4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-1.8z"
      />
    </svg>
  );
}

function MoneyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const amount = value.trim() === '' ? null : Number(value);
  const shown = amount === null || Number.isNaN(amount) ? '' : formatCurrency(amount);
  return (
    <input
      value={shown}
      inputMode="numeric"
      onChange={event => onChange(event.target.value.replace(/\D/g, ''))}
    />
  );
}

function Field({
  label,
  value,
  locked,
  wide,
  children
}: {
  label: string;
  value?: string;
  locked?: boolean;
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <label className={wide ? 'product-editor-wide' : undefined}>
      {label}
      {locked ? (
        <input className="is-locked" value={value ?? ''} disabled readOnly tabIndex={-1} />
      ) : (
        children
      )}
    </label>
  );
}

