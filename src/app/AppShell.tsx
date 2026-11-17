import { Boxes, Calculator, ClipboardList, Package, ShoppingBag, ShoppingCart, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useLocale } from '@/shared/i18n/useLocale';

type Section = 'wholesale' | 'retail' | 'load' | 'purchasing' | 'products';

const sectionIcons: Record<Section, LucideIcon> = {
  wholesale: Package,
  retail: ShoppingBag,
  load: ClipboardList,
  purchasing: ShoppingCart,
  products: Boxes
};

export function AppShellNav() {
  const { t } = useLocale();
  const { pathname } = useLocation();
  const current = sectionOf(pathname);
  return (
    <nav className="app-nav" aria-label={t('home')}>
      <SectionLink to="/" section="wholesale" current={current} label={t('wholesaleSection')} />
      <SectionLink to="/retail-sales" section="retail" current={current} label={t('retailSection')} />
      <SectionLink to="/load-sheets" section="load" current={current} label={t('loadSheet')} />
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
  if (pathname.startsWith('/load-sheets')) return 'load';
  if (pathname.startsWith('/purchasing')) return 'purchasing';
  if (pathname.startsWith('/products')) return 'products';
  return 'wholesale';
}
