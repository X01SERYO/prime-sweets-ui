import { Pencil, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { CreateBrandUseCase } from '@/modules/catalog/application/use-cases/createBrand.useCase';
import type { CreateCatalogProductUseCase } from '@/modules/catalog/application/use-cases/createCatalogProduct.useCase';
import type { ListBrandsUseCase } from '@/modules/catalog/application/use-cases/listBrands.useCase';
import type { SearchCatalogProductsUseCase } from '@/modules/catalog/application/use-cases/searchCatalogProducts.useCase';
import type { UpdateCatalogProductUseCase } from '@/modules/catalog/application/use-cases/updateCatalogProduct.useCase';
import type { Brand } from '@/modules/catalog/domain/models/brand';
import type { CatalogProduct, CatalogProductPatch } from '@/modules/catalog/domain/models/catalogProduct';
import { realMarginPercent, suggestedSalePrice } from '@/modules/catalog/domain/productPricing';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';
import { alegraSyncText } from '@/modules/catalog/adapters/ui/alegraSyncText';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { AppToast } from '@/shared/ui/AppToast';
import { Pager } from '@/shared/ui/Pager';
import { HttpRequestError } from '@/shared/infrastructure/http/httpClient';
import { ProductCreate } from '@/modules/catalog/adapters/ui/views/ProductCreate';
import './productAdmin.css';

interface ProductAdminProps {
  searchCatalogProducts: SearchCatalogProductsUseCase;
  updateCatalogProduct: UpdateCatalogProductUseCase;
  createCatalogProduct: CreateCatalogProductUseCase;
  listBrands: ListBrandsUseCase;
  createBrand: CreateBrandUseCase;
}

type SortKey = 'name' | 'code' | 'brand' | 'price' | 'margin';

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
  if (typeof wholesaleCost === 'string' || typeof units !== 'number') {
    return 'invalid';
  }
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

export function ProductAdmin({
  searchCatalogProducts,
  updateCatalogProduct,
  createCatalogProduct,
  listBrands,
  createBrand
}: ProductAdminProps) {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const createdName = (location.state as { createdName?: string } | null)?.createdName ?? '';
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandQuery, setBrandQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const selectedBrandsRef = useRef<string[]>([]);
  selectedBrandsRef.current = selectedBrands;
  const firstQuery = useRef(true);
  const skipBrands = useRef(true);
  const requestId = useRef(0);
  const dismissToast = useCallback(() => {
    setError(null);
    setNotice(null);
  }, []);

  async function load(nextPage: number, term: string, size = pageSize, brandNames = selectedBrandsRef.current) {
    const trimmed = term.trim();
    const id = ++requestId.current;
    setError(null);
    try {
      const found = await searchCatalogProducts.execute(nextPage, size, trimmed || undefined, brandNames);
      if (id !== requestId.current) {
        return;
      }
      setPage(found.page);
      setTotal(found.total);
      setPageSize(found.pageSize);
      setProducts(found.items);
      setAppliedQuery(trimmed);
    } catch {
      if (id !== requestId.current) {
        return;
      }
      setProducts([]);
      setError(t('catalogFailed'));
    }
  }

  useEffect(() => {
    void listBrands.execute().then(setBrands).catch(() => undefined);
  }, [listBrands]);

  const visible = useMemo(() => [...products].sort((left, right) => compareProducts(left, right, sortKey)), [products, sortKey]);

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

  useEffect(() => {
    if (firstQuery.current) {
      firstQuery.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void load(1, query);
    }, 250);
    return () => window.clearTimeout(timer);
    // Search runs as the text changes. load closes over the latest page size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (skipBrands.current) {
      skipBrands.current = false;
      return;
    }
    void load(1, query, pageSize, selectedBrands);
    // Brand selection reloads the first page with the current search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBrands]);

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
        setError(alegraSyncText(caught.message, t));
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
        <button className="btn product-admin-create" type="button" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" strokeWidth={2.4} />
          {t('createProduct')}
        </button>
      </div>
      <div className="product-admin-filters">
        <label className="product-admin-search">
          {t('searchProduct')}
          <span>
            <Search aria-hidden="true" strokeWidth={1.8} />
            <input
              type="search"
              value={query}
              placeholder={t('productSearchPlaceholder')}
              autoComplete="off"
              onChange={event => setQuery(event.target.value)}
            />
          </span>
        </label>
        <BrandFilter
          brands={brands}
          query={brandQuery}
          selected={selectedBrands}
          open={brandOpen}
          allLabel={t('allBrands')}
          label={t('brand')}
          onQuery={value => {
            setBrandQuery(value);
            setBrandOpen(true);
          }}
          onOpen={setBrandOpen}
          onToggle={name => {
            setSelectedBrands(current => (current.includes(name) ? current.filter(item => item !== name) : [...current, name]));
          }}
          onClear={() => setSelectedBrands([])}
        />
        <label className="product-admin-sort">
          {t('sortBy')}
          <select aria-label={t('sortBy')} value={sortKey} onChange={event => setSortKey(event.target.value as SortKey)}>
            <option value="name">{t('sortName')}</option>
            <option value="code">{t('sortCode')}</option>
            <option value="brand">{t('sortBrand')}</option>
            <option value="price">{t('sortPrice')}</option>
            <option value="margin">{t('sortMargin')}</option>
          </select>
        </label>
      </div>
      <div className="product-list" role="table" aria-label={t('products')}>
        <div className="pr thd" role="row">
          <span className="p-code">{t('code')}</span>
          <span className="p-name">{t('productName')}</span>
          <span className="p-brand">{t('brand')}</span>
          <span className="g-may">
            <span className="hf num">{t('productWholesaleCost')}</span>
            <span className="hf num">{t('wholesaleSale')}</span>
            <span className="hc num">{t('channelWholesale')}</span>
          </span>
          <span className="g-men">
            <span className="hf num">{t('retailCost')}</span>
            <span className="hf num">{t('retailSale')}</span>
            <span className="hc num">{t('channelRetail')}</span>
          </span>
          <span className="g-inv">
            <span className="hf num">{t('productUnits')}</span>
            <span className="hf num">{t('productPack')}</span>
            <span className="hc num">{t('packaging')}</span>
          </span>
          <span />
        </div>
        {visible.map(product => {
          const wholesaleMargin = realMarginPercent(product.wholesalePrice, product.wholesaleCost);
          const retailMargin = realMarginPercent(product.retailPrice, product.retailCost);
          return (
            <div className="pr" role="row" key={product.id}>
              <span className="p-code">{highlightMatch(product.code, appliedQuery)}</span>
              <span className="p-name">
                <b>{product.name ? highlightMatch(product.name, appliedQuery) : t('noName')}</b>
                <small className="p-sub">
                  {highlightMatch(product.code, appliedQuery)}
                  {product.brandName ? ' · ' : ''}
                  {product.brandName ? highlightMatch(product.brandName, appliedQuery) : ''}
                </small>
              </span>
              <span className="p-brand">{product.brandName ? highlightMatch(product.brandName, appliedQuery) : '—'}</span>
              <span className="g-may">
                <b className="gh">{t('channelWholesale')}</b>
                <PriceLine label={t('costLabel')} value={money(product.wholesaleCost, t('notAvailable'))} />
                <PriceLine label={t('saleLabel')} value={money(product.wholesalePrice, t('notAvailable'))} margin={wholesaleMargin} />
              </span>
              <span className="g-men">
                <b className="gh">{t('channelRetail')}</b>
                <PriceLine label={t('costLabel')} value={money(product.retailCost, t('notAvailable'))} />
                <PriceLine label={t('saleLabel')} value={money(product.retailPrice, t('notAvailable'))} margin={retailMargin} />
              </span>
              <span className="g-inv">
                <span className="num p-un">
                  <i className="lb">{t('productUnits')}</i>
                  {product.units}
                </span>
                <span className="num p-ca">
                  <i className="lb">{t('productPack')}</i>
                  {product.pack || '—'}
                </span>
              </span>
              <span className="p-act">
                <button className="btn icon-btn icon-edit" type="button" aria-label={t('editProduct')} onClick={() => openEditor(product)}>
                  <Pencil aria-hidden="true" strokeWidth={1.8} />
                </button>
              </span>
            </div>
          );
        })}
      </div>
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
      {creating ? (
        <CreateDialog
          onClose={() => setCreating(false)}
          onCreated={name => {
            setCreating(false);
            setNotice(t('productCreated').replace('{name}', name));
            void load(1, appliedQuery);
          }}
          createCatalogProduct={createCatalogProduct}
          listBrands={listBrands}
          createBrand={createBrand}
        />
      ) : null}
      <Pager
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={next => void load(next, appliedQuery)}
        onPageSize={size => {
          setPageSize(size);
          void load(1, appliedQuery, size);
        }}
      />
      {!editing && (error || notice) ? <Toast error={error} notice={notice} onDone={dismissToast} /> : null}
    </section>
  );
}

function compareProducts(left: CatalogProduct, right: CatalogProduct, sortKey: SortKey): number {
  if (sortKey === 'code') {
    return left.code.localeCompare(right.code, 'es');
  }
  if (sortKey === 'brand') {
    return (left.brandName ?? '').localeCompare(right.brandName ?? '', 'es') || (left.name ?? '').localeCompare(right.name ?? '', 'es');
  }
  if (sortKey === 'price') {
    return (right.wholesalePrice ?? 0) - (left.wholesalePrice ?? 0);
  }
  if (sortKey === 'margin') {
    return (realMarginPercent(left.wholesalePrice, left.wholesaleCost) ?? 1e9) - (realMarginPercent(right.wholesalePrice, right.wholesaleCost) ?? 1e9);
  }
  return (left.name ?? '').localeCompare(right.name ?? '', 'es');
}

function PriceLine({ label, value, margin }: { label: string; value: string; margin?: number | null }) {
  return (
    <span className="price-line">
      <span className="price-pct">{margin === undefined ? null : <Margin value={margin} />}</span>
      <span className="price-lb">{label}</span>
      <span className="price-val">{value}</span>
    </span>
  );
}

function Margin({ value }: { value: number | null }) {
  if (value === null) {
    return null;
  }
  const tone = value < 0 ? 'neg' : value < 10 ? 'low' : '';
  return <em className={`product-admin-margin ${tone}`}>{`${value >= 0 ? '+' : ''}${value.toFixed(2)} %`}</em>;
}

function BrandFilter({
  brands,
  query,
  selected,
  open,
  label,
  allLabel,
  onQuery,
  onOpen,
  onToggle,
  onClear
}: {
  brands: Brand[];
  query: string;
  selected: string[];
  open: boolean;
  label: string;
  allLabel: string;
  onQuery: (value: string) => void;
  onOpen: (open: boolean) => void;
  onToggle: (name: string) => void;
  onClear: () => void;
}) {
  const needle = query.trim().toLocaleUpperCase('es-CO');
  const options = brands.filter(brand => brand.name.toLocaleUpperCase('es-CO').includes(needle));
  return (
    <label className="product-brand-combo product-admin-brand">
      {label}
      <input
        value={query}
        placeholder={selected.length > 0 ? selected.join(', ') : allLabel}
        autoComplete="off"
        aria-label={label}
        onFocus={() => onOpen(true)}
        onBlur={() => window.setTimeout(() => onOpen(false), 150)}
        onChange={event => onQuery(event.target.value.toLocaleUpperCase('es-CO'))}
      />
      {open ? (
        <ul className="product-brand-options">
          <li>
            <button type="button" onMouseDown={event => event.preventDefault()} onClick={onClear}>
              {allLabel}
            </button>
          </li>
          {options.map(brand => (
            <li key={brand.id}>
              <button type="button" aria-pressed={selected.includes(brand.name)} onMouseDown={event => event.preventDefault()} onClick={() => onToggle(brand.name)}>
                {selected.includes(brand.name) ? '✓ ' : ''}
                {brand.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

function CreateDialog({
  onClose,
  onCreated,
  createCatalogProduct,
  listBrands,
  createBrand
}: {
  onClose: () => void;
  onCreated: (name: string) => void;
  createCatalogProduct: CreateCatalogProductUseCase;
  listBrands: ListBrandsUseCase;
  createBrand: CreateBrandUseCase;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    anchorRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <dialog ref={dialogRef} className="product-editor" onCancel={onClose}>
      <span ref={anchorRef} className="product-dialog-anchor" tabIndex={-1} />
      <ProductCreate
        createCatalogProduct={createCatalogProduct}
        listBrands={listBrands}
        createBrand={createBrand}
        onCancel={onClose}
        onCreated={onCreated}
      />
    </dialog>
  );
}

function highlightMatch(text: string, query: string): ReactNode {
  const needle = query.trim();
  if (!needle) {
    return text;
  }
  const index = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
  if (index < 0) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
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
  const { t } = useLocale();
  if (!message) {
    return null;
  }
  return (
    <AppToast tone={error ? 'error' : 'success'} message={message} onDone={onDone}>
      <strong className="product-admin-toast-title">{error ? t('toastError') : t('toastOk')}: </strong>
      {message}
    </AppToast>
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

