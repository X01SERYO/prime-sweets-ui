import { Boxes, Calculator, ClipboardList, Package, Plus, ShoppingBag, ShoppingCart, Truck, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { businessToday } from '@/modules/sales/domain/deliveryDays';
import { useLocale } from '@/shared/i18n/useLocale';

type Section = 'wholesale' | 'retail' | 'load' | 'purchasing' | 'products';


const sectionIcons: Record<Section, LucideIcon> = {
  wholesale: Package,
  retail: ShoppingBag,
  load: Package,
  purchasing: ShoppingCart,
  products: Boxes
};

export function AppShellNav() {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const current = sectionOf(pathname);
  const today = businessToday();
  return (
    <nav className="app-nav" aria-label={t('home')}>
      <div className="app-nav-group">
        <SectionLink to="/" section="wholesale" current={current} label={t('wholesaleSection')} />
        {current === 'wholesale' ? (
          <div className="app-nav-sub">
            <Link to="/sales" aria-current={pathname.startsWith('/sales') ? 'page' : undefined}>
              <Plus aria-hidden="true" strokeWidth={1.8} />
              {t('newSale')}
            </Link>
            <Link to={`/delivery-sales?deliveryDate=${today}`} aria-current={pathname.startsWith('/delivery-sales') ? 'page' : undefined}>
              <Truck aria-hidden="true" strokeWidth={1.8} />
              {t('salesOfDay')}
            </Link>
            <Link to={`/load-sheets?deliveryDate=${today}`} aria-current={pathname.startsWith('/load-sheets') ? 'page' : undefined}>
              <ClipboardList aria-hidden="true" strokeWidth={1.8} />
              {t('loadSheet')}
            </Link>
          </div>
        ) : null}
      </div>
      <SectionLink to="/retail-sales" section="retail" current={current} label={t('retailSection')} />
      <SectionLink to="/purchasing" section="purchasing" current={current} label={t('purchaseSection')} />
      <SectionLink to="/products" section="products" current={current} label={t('products')} />
      <span className="app-nav-disabled" aria-disabled="true" title={t('accountingUnavailable')}>
        <Calculator aria-hidden="true" strokeWidth={1.8} />
        {t('accountingSection')}
      </span>
    </nav>
  );
}

function SectionLink({
  to,
  section,
  current,
  label
}: {
  to: string;
  section: Section;
  current: Section;
  label: string;
}) {
  const Icon = sectionIcons[section];
  return (
    <Link to={to} data-section={section} aria-current={current === section ? 'page' : undefined}>
      <Icon aria-hidden="true" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

function sectionOf(pathname: string): Section {
  if (pathname.startsWith('/retail-sales')) return 'retail';
  if (pathname.startsWith('/purchasing')) return 'purchasing';
  if (pathname.startsWith('/products')) return 'products';
  return 'wholesale';
}
