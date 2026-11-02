import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { CreateBrandUseCase } from '@/modules/catalog/application/use-cases/createBrand.useCase';
import type { CreateCatalogProductUseCase } from '@/modules/catalog/application/use-cases/createCatalogProduct.useCase';
import type { ListBrandsUseCase } from '@/modules/catalog/application/use-cases/listBrands.useCase';
import type { Brand } from '@/modules/catalog/domain/models/brand';
import { realMarginPercent, suggestedSalePrice } from '@/modules/catalog/domain/productPricing';
import { CatalogInvalidError } from '@/modules/catalog/domain/errors/catalogInvalid.error';
import { formatCurrency } from '@/shared/domain/money';
import { useLocale } from '@/shared/i18n/useLocale';
import { ScreenTitle } from '@/shared/ui/BackButton';
import { HttpRequestError } from '@/shared/infrastructure/http/httpClient';
import './productAdmin.css';

interface ProductCreateProps {
  createCatalogProduct: CreateCatalogProductUseCase;
  listBrands: ListBrandsUseCase;
  createBrand: CreateBrandUseCase;
}

export function ProductCreate({ createCatalogProduct, listBrands, createBrand }: ProductCreateProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [brandQuery, setBrandQuery] = useState('');
  const [brandListOpen, setBrandListOpen] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandCode, setBrandCode] = useState('');
  const [name, setName] = useState('');
  const [margin, setMargin] = useState('15');
  const [wholesaleCost, setWholesaleCost] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [units, setUnits] = useState('0');
  const [pack, setPack] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = parseMoney(wholesaleCost);
  const suggested = suggestedSalePrice(cost, Number(margin));
  const retailCost = retailUnitCost(cost, Number(units));
  const canSave = name.trim() !== '' && retailCost > 0 && !saving;

  useEffect(() => {
    void listBrands.execute().then(setBrands).catch(() => setError(t('catalogFailed')));
  }, [listBrands, t]);

  async function saveBrand() {
    const nextName = brandName.trim();
    const nextCode = brandCode.trim();
    if (!nextName || !nextCode) {
      setError(t('productInvalid'));
      return;
    }
    setError(null);
    try {
      const created = await createBrand.execute({ name: nextName, code: nextCode });
      setBrands(current => [...current, created].sort((left, right) => left.name.localeCompare(right.name, 'es')));
      setBrandId(created.id);
      setBrandQuery(created.name);
      setBrandName('');
      setBrandCode('');
      setAddingBrand(false);
    } catch (caught) {
      setError(caught instanceof HttpRequestError ? caught.message : t('productUpdateFailed'));
    }
  }

  async function save() {
    const wholesale = parseMoney(wholesaleCost);
    const sale = parseMoney(wholesalePrice);
    const retail = parseMoney(retailPrice);
    const unitCount = Number(units);
    const packCount = Number(pack);
    if (
      !name.trim() ||
      wholesale === null ||
      sale === null ||
      retail === null ||
      !Number.isInteger(unitCount) ||
      unitCount < 0 ||
      !Number.isInteger(packCount) ||
      packCount < 0 ||
      retailCost <= 0
    ) {
      setError(t('productInvalid'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await createCatalogProduct.execute({
        name: name.trim(),
        ...(brandId ? { brandId } : {}),
        wholesaleCost: wholesale,
        wholesalePrice: sale,
        retailCost,
        retailPrice: retail,
        units: unitCount,
        pack: packCount
      });
      navigate('/products', { state: { createdName: saved.name ?? saved.code } });
    } catch (caught) {
      if (caught instanceof HttpRequestError && caught.code === 'ALEGRA_SYNC_FAILED') {
        setError(`${t('alegraSyncFailed')} ${caught.message}`);
      } else if (caught instanceof HttpRequestError && caught.code === 'PRODUCT_ALREADY_EXISTS') {
        setError(t('productExists'));
      } else {
        setError(caught instanceof CatalogInvalidError || caught instanceof HttpRequestError ? t('productInvalid') : t('productUpdateFailed'));
      }
      setSaving(false);
    }
  }

  return (
    <section className="stack product-editor">
      <ScreenTitle>{t('createProduct')}</ScreenTitle>
      {error ? <p className="product-editor-error" role="alert">{error}</p> : null}
      <div className="product-editor-grid">
        <Field label={t('brand')} wide>
          <span className="product-brand-row">
            <span className="product-brand-combo">
              <input
                value={brandQuery}
                autoComplete="off"
                onFocus={() => setBrandListOpen(true)}
                onBlur={() => window.setTimeout(() => setBrandListOpen(false), 120)}
                onChange={event => {
                  const next = event.target.value.toLocaleUpperCase('es-CO');
                  setBrandQuery(next);
                  setBrandListOpen(true);
                  const found = brands.find(brand => brand.name === next);
                  setBrandId(found?.id ?? '');
                }}
              />
              {brandListOpen ? (
                <ul className="product-brand-options">
                  {brands
                    .filter(brand => brand.name.includes(brandQuery.trim()))
                    .map(brand => (
                      <li key={brand.id}>
                        <button
                          type="button"
                          onMouseDown={event => event.preventDefault()}
                          onClick={() => {
                            setBrandId(brand.id);
                            setBrandQuery(brand.name);
                            setBrandListOpen(false);
                          }}
                        >
                          {brand.name}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null}
            </span>
            <button className="btn product-brand-add" type="button" aria-label={t('addBrand')} onClick={() => setAddingBrand(current => !current)}>
              +
            </button>
          </span>
        </Field>
        {addingBrand ? (
          <div className="product-editor-line">
            <Field label={t('productName')}>
              <input value={brandName} onChange={event => setBrandName(event.target.value.toLocaleUpperCase('es-CO'))} />
            </Field>
            <Field label={t('code')}>
              <input
                value={brandCode}
                maxLength={3}
                onChange={event => setBrandCode(event.target.value.toLocaleUpperCase('es-CO').slice(0, 3))}
              />
            </Field>
            <button className="btn product-brand-save" type="button" onClick={() => void saveBrand()}>
              {t('saveProduct')}
            </button>
          </div>
        ) : null}
        <Field label={t('productName')} wide>
          <input value={name} onChange={event => setName(event.target.value.toLocaleUpperCase('es-CO'))} />
        </Field>
        <Field label={t('marginPercent')}>
          <input value={margin} inputMode="decimal" onChange={event => setMargin(event.target.value)} />
        </Field>
        <Field label={t('suggestedPrice')} value={money(suggested, t('notAvailable'))} locked />
        <div className="product-editor-line">
          <Field label={t('productWholesaleCost')}>
            <MoneyInput value={wholesaleCost} onChange={setWholesaleCost} />
          </Field>
          <Field label={t('wholesaleSale')}>
            <MoneyInput value={wholesalePrice} onChange={setWholesalePrice} />
          </Field>
          <Field
            label={t('wholesaleMargin')}
            value={percent(realMarginPercent(parseMoney(wholesalePrice), cost), t('notAvailable'))}
            locked
          />
        </div>
        <div className="product-editor-line">
          <Field label={t('retailCost')} value={money(retailCost, t('notAvailable'))} locked />
          <Field label={t('retailSale')}>
            <MoneyInput value={retailPrice} onChange={setRetailPrice} />
          </Field>
          <Field
            label={t('retailMargin')}
            value={percent(realMarginPercent(parseMoney(retailPrice), retailCost) ?? 0, t('notAvailable'))}
            locked
          />
        </div>
        <Field label={t('productUnits')}>
          <input value={units} inputMode="numeric" onChange={event => setUnits(event.target.value)} />
        </Field>
        <Field label={t('productPack')}>
          <input value={pack} inputMode="numeric" onChange={event => setPack(event.target.value)} />
        </Field>
      </div>
      <div className="product-editor-actions">
        <button className="btn btn-secondary" type="button" onClick={() => navigate('/products')}>
          {t('cancelAction')}
        </button>
        <button className="btn" type="button" disabled={!canSave} onClick={() => void save()}>
          {saving ? t('savingProduct') : t('saveProduct')}
        </button>
      </div>
    </section>
  );
}

function retailUnitCost(wholesaleCost: number | null, units: number): number {
  if (wholesaleCost === null || !Number.isFinite(wholesaleCost) || !Number.isFinite(units) || units <= 0) {
    return 0;
  }
  return Math.round(wholesaleCost / units);
}

function parseMoney(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function money(value: number | null, empty: string): string {
  return value === null ? empty : formatCurrency(value);
}

function percent(value: number | null, empty: string): string {
  return value === null ? empty : `${value}%`;
}

function MoneyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const amount = value.trim() === '' ? null : Number(value);
  const shown = amount === null || Number.isNaN(amount) ? '' : formatCurrency(amount);
  return <input value={shown} inputMode="numeric" onChange={event => onChange(event.target.value.replace(/\D/g, ''))} />;
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
      {locked ? <input className="is-locked" value={value ?? ''} disabled readOnly tabIndex={-1} /> : children}
    </label>
  );
}
